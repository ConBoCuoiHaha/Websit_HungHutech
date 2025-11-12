package com.hunghutech.hrm.utils;

import android.content.Context;
import android.net.DhcpInfo;
import android.net.wifi.WifiManager;
import android.os.Handler;
import android.os.Looper;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class LanScanner {
    public interface Callback { void onResult(String baseUrl); }

    private static String intToIp(int i) {
        return ((i & 0xFF)) + "." + ((i >> 8) & 0xFF) + "." + ((i >> 16) & 0xFF) + "." + ((i >> 24) & 0xFF);
    }

    public static void discover(Context ctx, int port, Callback cb) {
        Handler main = new Handler(Looper.getMainLooper());
        try {
            WifiManager wm = (WifiManager) ctx.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            DhcpInfo d = wm.getDhcpInfo();
            if (d == null || d.netmask == 0) { main.post(() -> cb.onResult(null)); return; }
            int ip = d.ipAddress;
            int mask = d.netmask;
            int network = ip & mask;
            int broadcast = network | (~mask);

            List<String> candidates = new ArrayList<>();
            int hostCount = (broadcast - network) - 1;
            if (hostCount > 1024) {
                // Subnet quá lớn (ví dụ /16 hoặc /8). Quét nhanh trong /24 chứa thiết bị.
                int base24 = ip & 0xFFFFFF00; // giữ nguyên 3 octet đầu
                for (int host = 1; host < 255; host++) {
                    int addr = base24 | host;
                    candidates.add(intToIp(addr));
                }
            } else {
                // Quét toàn bộ subnet thực tế
                for (int addr = network + 1; addr < broadcast; addr++) {
                    candidates.add(intToIp(addr));
                }
            }

            OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(2, TimeUnit.SECONDS)
                    .readTimeout(2, TimeUnit.SECONDS)
                    .build();

            AtomicReference<String> found = new AtomicReference<>(null);
            AtomicBoolean done = new AtomicBoolean(false);
            ExecutorService pool = Executors.newFixedThreadPool(48);

            for (String hostIp : candidates) {
                pool.execute(() -> {
                    if (done.get()) return;
                    try {
                        String url = "http://" + hostIp + ":" + port + "/health";
                        Request req = new Request.Builder().url(url).build();
                        try (Response resp = client.newCall(req).execute()) {
                            if (resp.isSuccessful()) {
                                if (done.compareAndSet(false, true)) {
                                    String base = "http://" + hostIp + ":" + port + "/api/";
                                    found.set(base);
                                    main.post(() -> cb.onResult(base));
                                }
                            }
                        }
                    } catch (Exception ignored) {}
                });
            }

            // Fallback timeout
            main.postDelayed(() -> {
                if (done.compareAndSet(false, true)) cb.onResult(null);
                pool.shutdownNow();
            }, 7000);
        } catch (Exception e) {
            main.post(() -> cb.onResult(null));
        }
    }
}
