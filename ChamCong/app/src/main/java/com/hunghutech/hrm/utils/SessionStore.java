package com.hunghutech.hrm.utils;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONException;
import org.json.JSONObject;

public class SessionStore {
    private static final String PREFS = "hrm_session";
    private static final String KEY_USER = "user";
    private static SessionStore instance;
    private final SharedPreferences prefs;

    private SessionStore(Context ctx) {
        prefs = ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static synchronized SessionStore get(Context ctx) {
        if (instance == null) instance = new SessionStore(ctx);
        return instance;
    }

    public void saveUser(JSONObject user) {
        prefs.edit().putString(KEY_USER, user != null ? user.toString() : null).apply();
    }

    public JSONObject getUser() {
        String s = prefs.getString(KEY_USER, null);
        if (s == null) return null;
        try { return new JSONObject(s); } catch (JSONException e) { return null; }
    }

    public String getRole() {
        JSONObject u = getUser();
        return u != null ? u.optString("role", null) : null;
    }
}

