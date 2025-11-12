package com.hunghutech.hrm.utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.os.Handler;
import android.os.Looper;

import java.net.InetAddress;

public class DynamicServer {
    private static final String PREFS = "hrm_dynamic_server";
    private static final String KEY_BASE = "base_url";
    public interface Callback { void onResult(String baseUrl); }

    public static String getBaseUrl(Context ctx, String fallback) {
        SharedPreferences p = ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String v = p.getString(KEY_BASE, null);
        return (v != null && !v.isEmpty()) ? v : fallback;
    }

    public static void saveBaseUrl(Context ctx, String base) {
        if (base == null) return;
        ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY_BASE, base).apply();
    }

    // Discover _hunghutech._tcp. and resolve once; timeout after 5s
    public static void discover(Context ctx, Callback cb) {
        final NsdManager nsd = (NsdManager) ctx.getSystemService(Context.NSD_SERVICE);
        final Handler handler = new Handler(Looper.getMainLooper());

        // Holder to reference listener from inner callbacks safely
        final NsdManager.DiscoveryListener[] holder = new NsdManager.DiscoveryListener[1];

        NsdManager.DiscoveryListener listener = new NsdManager.DiscoveryListener() {
            @Override public void onStartDiscoveryFailed(String serviceType, int errorCode) { finish(null); }
            @Override public void onStopDiscoveryFailed(String serviceType, int errorCode) { }
            @Override public void onDiscoveryStarted(String serviceType) { }
            @Override public void onDiscoveryStopped(String serviceType) { }
            @Override public void onServiceLost(NsdServiceInfo serviceInfo) { }
            @Override public void onServiceFound(NsdServiceInfo serviceInfo) {
                if (!"_hunghutech._tcp.".equals(serviceInfo.getServiceType())) return;
                nsd.resolveService(serviceInfo, new NsdManager.ResolveListener() {
                    @Override public void onResolveFailed(NsdServiceInfo serviceInfo, int errorCode) { }
                    @Override public void onServiceResolved(NsdServiceInfo info) {
                        InetAddress host = info.getHost();
                        int port = info.getPort();
                        if (host != null && port > 0) {
                            String base = "http://" + host.getHostAddress() + ":" + port + "/api/";
                            saveBaseUrl(ctx, base);
                            try { if (holder[0] != null) nsd.stopServiceDiscovery(holder[0]); } catch (Exception ignored) {}
                            cb.onResult(base);
                        }
                    }
                });
            }
            private void finish(String base) {
                try { if (holder[0] != null) nsd.stopServiceDiscovery(holder[0]); } catch (Exception ignored) {}
                cb.onResult(base);
            }
        };

        holder[0] = listener;
        try {
            nsd.discoverServices("_hunghutech._tcp.", NsdManager.PROTOCOL_DNS_SD, listener);
        } catch (Exception e) {
            cb.onResult(null); return;
        }
        handler.postDelayed(() -> {
            try { if (holder[0] != null) nsd.stopServiceDiscovery(holder[0]); } catch (Exception ignored) {}
            cb.onResult(null);
        }, 5000);
    }
}
