package com.hunghutech.hrm.ui.profile;

import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.hunghutech.hrm.R;
import com.hunghutech.hrm.data.api.AdminService;
import com.hunghutech.hrm.data.api.ApiClient;
import com.hunghutech.hrm.data.api.UserService;
import com.hunghutech.hrm.utils.SessionStore;

import org.json.JSONObject;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProfileActivity extends AppCompatActivity {
    private ProgressBar progress; private TextView tvName, tvEmail, tvCode, tvDept;
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);
        progress = findViewById(R.id.progress);
        tvName = findViewById(R.id.tvName);
        tvEmail = findViewById(R.id.tvEmail);
        tvCode = findViewById(R.id.tvCode);
        tvDept = findViewById(R.id.tvDept);
        load();
    }

    private void load() {
        progress.setVisibility(View.VISIBLE);
        UserService us = ApiClient.get(this).create(UserService.class);
        us.me().enqueue(new Callback<ResponseBody>() {
            @Override public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                try {
                    if (response.isSuccessful() && response.body()!=null) {
                        JSONObject me = new JSONObject(response.body().string());
                        String email = me.optString("email","-");
                        tvEmail.setText(email);
                        String empId = me.optString("nhan_vien_id", null);
                        if (empId != null) loadEmployee(empId);
                        else progress.setVisibility(View.GONE);
                    } else progress.setVisibility(View.GONE);
                } catch (Exception e) { progress.setVisibility(View.GONE); }
            }
            @Override public void onFailure(Call<ResponseBody> call, Throwable t) { progress.setVisibility(View.GONE); }
        });
    }

    private void loadEmployee(String id) {
        AdminService svc = ApiClient.get(this).create(AdminService.class);
        svc.getEmployees(null, 1000).enqueue(new Callback<ResponseBody>() {
            @Override public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                progress.setVisibility(View.GONE);
                try {
                    if (response.isSuccessful() && response.body()!=null) {
                        org.json.JSONObject o = new org.json.JSONObject(response.body().string());
                        org.json.JSONArray arr = o.optJSONArray("data");
                        if (arr!=null) for (int i=0;i<arr.length();i++) {
                            org.json.JSONObject e = arr.optJSONObject(i);
                            if (e!=null && id.equals(e.optString("_id"))) {
                                String name = (e.optString("ho_dem"," ").trim()+" "+e.optString("ten"," ")).trim();
                                tvName.setText(name);
                                tvCode.setText(e.optString("ma_nhan_vien","-"));
                                org.json.JSONObject dept = e.optJSONObject("thong_tin_cong_viec")!=null ? e.optJSONObject("thong_tin_cong_viec").optJSONObject("phong_ban_id") : null;
                                tvDept.setText(dept!=null?dept.optString("ten","-"):"-");
                                break;
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }
            @Override public void onFailure(Call<ResponseBody> call, Throwable t) { progress.setVisibility(View.GONE); }
        });
    }
}

