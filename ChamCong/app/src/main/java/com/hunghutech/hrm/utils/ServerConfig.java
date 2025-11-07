package com.hunghutech.hrm.utils;

import android.content.Context;
import android.content.SharedPreferences;

import com.hunghutech.hrm.BuildConfig;

public class ServerConfig {
    private static final String PREFS = "hrm_server_config";
    private static final String KEY_BASE_URL_OVERRIDE = "base_url_override";

    public static String getBaseUrl(Context ctx) {
        SharedPreferences prefs = ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String override = prefs.getString(KEY_BASE_URL_OVERRIDE, null);
        String base = (override != null && !override.isEmpty()) ? override : BuildConfig.BASE_URL;
        if (base != null && !base.endsWith("/")) base = base + "/";
        return base;
    }

    public static void setBaseUrlOverride(Context ctx, String url) {
        ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY_BASE_URL_OVERRIDE, url).apply();
    }

    public static void clearOverride(Context ctx) {
        ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().remove(KEY_BASE_URL_OVERRIDE).apply();
    }
}

