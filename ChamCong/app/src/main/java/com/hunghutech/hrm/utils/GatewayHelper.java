package com.hunghutech.hrm.utils;

import android.content.Context;
import android.net.DhcpInfo;
import android.net.wifi.WifiManager;

public class GatewayHelper {
    private static String intToIp(int i) {
        return ((i & 0xFF)) + "." + ((i >> 8) & 0xFF) + "." + ((i >> 16) & 0xFF) + "." + ((i >> 24) & 0xFF);
    }

    public static String makeBaseUrl(Context ctx, int port) {
        try {
            WifiManager wm = (WifiManager) ctx.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            DhcpInfo d = wm.getDhcpInfo();
            if (d == null) return null;
            String gw = intToIp(d.gateway);
            if (gw == null || gw.equals("0.0.0.0")) return null;
            return "http://" + gw + ":" + port + "/api/";
        } catch (Throwable t) {
            return null;
        }
    }
}

