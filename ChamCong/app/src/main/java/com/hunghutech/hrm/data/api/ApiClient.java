package com.hunghutech.hrm.data.api;

import android.content.Context;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.hunghutech.hrm.BuildConfig;
import com.hunghutech.hrm.utils.DynamicServer;
import com.hunghutech.hrm.utils.ServerConfig;
import com.hunghutech.hrm.utils.TokenStore;

import java.util.concurrent.TimeUnit;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ApiClient {
    private static Retrofit retrofit;

    public static synchronized void reset() { retrofit = null; }

    public static Retrofit get(Context context) {
        if (retrofit != null) return retrofit;

        Gson gson = new GsonBuilder()
                .setLenient()
                .create();

        HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
        logging.setLevel(HttpLoggingInterceptor.Level.BASIC);

        Interceptor authInterceptor = chain -> {
            Request original = chain.request();
            String token = TokenStore.getInstance(context).getToken();
            Request.Builder builder = original.newBuilder();
            if (token != null && !token.isEmpty()) {
                builder.header("Authorization", "Bearer " + token);
            }
            return chain.proceed(builder.build());
        };

        OkHttpClient client = new OkHttpClient.Builder()
                .addInterceptor(authInterceptor)
                .addInterceptor(logging)
                .connectTimeout(20, TimeUnit.SECONDS)
                .readTimeout(20, TimeUnit.SECONDS)
                .build();

        // Priority: user override -> NSD cache -> hotspot gateway (192.168.137.x) -> fallback BuildConfig
        String override = ServerConfig.getBaseUrl(context);
        String discovered = DynamicServer.getBaseUrl(context, null);
        String gatewayBase = com.hunghutech.hrm.utils.GatewayHelper.makeBaseUrl(context, 5000);
        boolean hotspotLikely = gatewayBase != null && gatewayBase.contains("://192.168.137.");
        String base = override != null ? override : (discovered != null ? discovered : (hotspotLikely ? gatewayBase : BuildConfig.BASE_URL));
        android.util.Log.i("ApiClient", "BASE_URL=" + base);
        retrofit = new Retrofit.Builder()
                .baseUrl(base)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build();
        return retrofit;
    }
}
