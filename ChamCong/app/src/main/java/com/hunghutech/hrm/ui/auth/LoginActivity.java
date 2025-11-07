package com.hunghutech.hrm.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.hunghutech.hrm.R;
import com.hunghutech.hrm.data.api.ApiClient;
import com.hunghutech.hrm.data.api.AuthService;
import com.hunghutech.hrm.data.model.LoginRequest;
import com.hunghutech.hrm.data.model.LoginResponse;
import com.hunghutech.hrm.ui.home.HomeActivity;
import com.hunghutech.hrm.utils.TokenStore;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {
    private EditText emailEt, passwordEt;
    private ProgressBar progress;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        emailEt = findViewById(R.id.etEmail);
        passwordEt = findViewById(R.id.etPassword);
        progress = findViewById(R.id.progress);
        Button btnLogin = findViewById(R.id.btnLogin);
        Button btnServer = findViewById(R.id.btnServerSettings);

        // Auto-continue if token exists
        String existing = TokenStore.getInstance(this).getToken();
        if (existing != null && !existing.isEmpty()) {
            startActivity(new Intent(this, HomeActivity.class));
            finish();
            return;
        }

        btnLogin.setOnClickListener(v -> doLogin());
        btnServer.setOnClickListener(v -> startActivity(new Intent(this, com.hunghutech.hrm.ui.settings.SettingsActivity.class)));
    }

    private void doLogin() {
        String email = emailEt.getText().toString().trim();
        String password = passwordEt.getText().toString();
        if (TextUtils.isEmpty(email) || TextUtils.isEmpty(password)) {
            Toast.makeText(this, "Nhập email và mật khẩu", Toast.LENGTH_SHORT).show();
            return;
        }
        progress.setVisibility(View.VISIBLE);

        AuthService service = ApiClient.get(this).create(AuthService.class);
        service.login(new LoginRequest(email, password)).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                progress.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    TokenStore.getInstance(LoginActivity.this).saveToken(response.body().token);
                    try {
                        org.json.JSONObject u = new org.json.JSONObject(new com.google.gson.Gson().toJson(response.body().user));
                        com.hunghutech.hrm.utils.SessionStore.get(LoginActivity.this).saveUser(u);
                    } catch (Exception ignored) {}
                    startActivity(new Intent(LoginActivity.this, HomeActivity.class));
                    finish();
                } else {
                    try {
                        String err = response.errorBody()!=null? response.errorBody().string(): null;
                        if (err!=null && err.startsWith("{")) {
                            org.json.JSONObject o = new org.json.JSONObject(err);
                            Toast.makeText(LoginActivity.this, o.optString("msg","Đăng nhập thất bại"), Toast.LENGTH_SHORT).show();
                        } else {
                            Toast.makeText(LoginActivity.this, "Đăng nhập thất bại", Toast.LENGTH_SHORT).show();
                        }
                    } catch (Exception e) {
                        Toast.makeText(LoginActivity.this, "Đăng nhập thất bại", Toast.LENGTH_SHORT).show();
                    }
                }
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                progress.setVisibility(View.GONE);
                Toast.makeText(LoginActivity.this, t.getMessage()+". Kiểm tra Cài đặt máy chủ.", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
