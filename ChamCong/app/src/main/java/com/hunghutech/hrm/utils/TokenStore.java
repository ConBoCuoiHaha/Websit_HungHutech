package com.hunghutech.hrm.utils;

import android.content.Context;
import android.content.SharedPreferences;

public class TokenStore {
    private static final String PREFS = "hrm_token_store";
    private static final String KEY_TOKEN = "token";
    private static TokenStore instance;
    private final SharedPreferences prefs;

    private TokenStore(Context ctx) {
        this.prefs = ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static synchronized TokenStore getInstance(Context ctx) {
        if (instance == null) instance = new TokenStore(ctx);
        return instance;
    }

    public void saveToken(String token) {
        prefs.edit().putString(KEY_TOKEN, token).apply();
    }

    public String getToken() {
        return prefs.getString(KEY_TOKEN, null);
    }

    public void clear() {
        prefs.edit().clear().apply();
    }
}

