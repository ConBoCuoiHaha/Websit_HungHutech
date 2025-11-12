package com.hunghutech.hrm.ui.settings;

import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.hunghutech.hrm.R;
import com.hunghutech.hrm.data.api.ApiClient;
import com.hunghutech.hrm.utils.DynamicServer;
import com.hunghutech.hrm.utils.GatewayHelper;
import com.hunghutech.hrm.utils.ServerConfig;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class SettingsActivity extends AppCompatActivity {
    private EditText etUrl;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        etUrl = findViewById(R.id.etBaseUrl);
        String current = ServerConfig.getBaseUrl(this);
        if (current == null) current = GatewayHelper.makeBaseUrl(this, 5000);
        if (current == null) current = com.hunghutech.hrm.BuildConfig.BASE_URL;
        etUrl.setText(current);

        Button btnSave = findViewById(R.id.btnSave);
        Button btnReset = findViewById(R.id.btnReset);
        Button btnAuto = findViewById(R.id.btnAuto);
        Button btnTest = findViewById(R.id.btnTest);

        btnSave.setOnClickListener(v -> {
            String url = etUrl.getText().toString().trim();
            if (TextUtils.isEmpty(url)) { toast("Nhập URL"); return; }
            if (!url.endsWith("/")) url = url + "/";
            ServerConfig.setBaseUrl(this, url);
            ApiClient.reset();
            toast("Đã lưu máy chủ");
            finish();
        });

        btnReset.setOnClickListener(v -> {
            ServerConfig.clear(this);
            ApiClient.reset();
            toast("Đã xoá URL tuỳ chỉnh");
            finish();
        });

        btnAuto.setOnClickListener(v -> {
            // Thử NSD, nếu không có sẽ quét LAN
            DynamicServer.discover(this, base -> {
                if (base != null) {
                    etUrl.setText(base);
                    toast("Tìm thấy: " + base);
                } else {
                    com.hunghutech.hrm.utils.LanScanner.discover(this, 5000, found -> {
                        runOnUiThread(() -> {
                            if (found != null) { etUrl.setText(found); toast("Tìm thấy: " + found); }
                            else toast("Không tìm thấy server trong LAN");
                        });
                    });
                }
            });
        });

        btnTest.setOnClickListener(v -> {
            new Thread(() -> {
                try {
                    String base = etUrl.getText().toString().trim();
                    if (!base.endsWith("/")) base += "/";
                    OkHttpClient c = new OkHttpClient.Builder().build();
                    Response r = c.newCall(new Request.Builder().url(base.replace("/api/","/") + "health").build()).execute();
                    final boolean ok = r.isSuccessful();
                    runOnUiThread(() -> toast(ok ? "Kết nối OK" : ("Lỗi: " + r.code())));
                } catch (Exception e) {
                    runOnUiThread(() -> toast("Lỗi: " + e.getMessage()));
                }
            }).start();
        });
    }

    private void toast(String s) { Toast.makeText(this, s, Toast.LENGTH_SHORT).show(); }
}

