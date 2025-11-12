package com.hunghutech.hrm.utils;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.text.TextUtils;

import com.hunghutech.hrm.BuildConfig;

import java.util.Arrays;
import java.util.List;

public class WifiGuard {
    public static boolean isOnAllowedWifi(Context ctx) {
        ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
        Network active = cm.getActiveNetwork();
        if (active == null) return false;
        NetworkCapabilities caps = cm.getNetworkCapabilities(active);
        if (caps == null || !caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) return false;
        try {
            WifiManager wm = (WifiManager) ctx.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            WifiInfo info = wm.getConnectionInfo();
            if (info == null) return false;
            String ssid = sanitizeSsid(info.getSSID());
            if (TextUtils.isEmpty(ssid)) return false;
            List<String> allowed = Arrays.asList(BuildConfig.ALLOWED_WIFI_SSIDS.split(","));
            for (String a : allowed) {
                if (ssid.equalsIgnoreCase(a.trim())) return true;
            }
            return false;
        } catch (Throwable t) { return false; }
    }

    private static String sanitizeSsid(String raw) {
        if (raw == null) return null;
        // Android thường trả về SSID kèm dấu "
        if (raw.startsWith("\"") && raw.endsWith("\"")) {
            return raw.substring(1, raw.length()-1);
        }
        return raw;
    }
}

