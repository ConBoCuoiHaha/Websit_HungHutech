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
import com.hunghutech.hrm.utils.ServerConfig;

public class SettingsActivity extends AppCompatActivity {
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        EditText etUrl = findViewById(R.id.etBaseUrl);
        View btnSave = findViewById(R.id.btnSave);
        View btnReset = findViewById(R.id.btnReset);

        // Pre-fill with current
        etUrl.setText(ServerConfig.getBaseUrl(this));

        btnSave.setOnClickListener(v -> {
            String url = etUrl.getText().toString().trim();
            if (TextUtils.isEmpty(url)) {
                Toast.makeText(this, "Nhập URL máy chủ", Toast.LENGTH_SHORT).show();
                return;
            }
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                Toast.makeText(this, "URL phải bắt đầu bằng http:// hoặc https://", Toast.LENGTH_SHORT).show();
                return;
            }
            if (!url.endsWith("/")) url = url + "/";
            ServerConfig.setBaseUrlOverride(this, url);
            ApiClient.reset();
            Toast.makeText(this, "Đã lưu. Vui lòng thử lại.", Toast.LENGTH_SHORT).show();
            finish();
        });

        btnReset.setOnClickListener(v -> {
            ServerConfig.clearOverride(this);
            ApiClient.reset();
            Toast.makeText(this, "Đã dùng mặc định.", Toast.LENGTH_SHORT).show();
            finish();
        });
    }
}

