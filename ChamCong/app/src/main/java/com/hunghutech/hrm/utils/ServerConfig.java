package com.hunghutech.hrm.utils;

import android.content.Context;
import android.content.SharedPreferences;

public class ServerConfig {
    private static final String PREFS = "hrm_server_config";
    private static final String KEY_BASE = "base_url_override";

    public static String getBaseUrl(Context ctx) {
        SharedPreferences p = ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String v = p.getString(KEY_BASE, null);
        if (v != null && !v.endsWith("/")) v = v + "/";
        return v;
    }

    public static void setBaseUrl(Context ctx, String url) {
        if (url == null) return;
        ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY_BASE, url).apply();
    }

    public static void clear(Context ctx) {
        ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().remove(KEY_BASE).apply();
    }
}

