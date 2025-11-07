package com.hunghutech.hrm.ui.home;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.hunghutech.hrm.R;
import com.hunghutech.hrm.ui.attendance.CheckInActivity;
import com.hunghutech.hrm.ui.attendance.HistoryActivity;
import com.hunghutech.hrm.ui.auth.LoginActivity;
import com.hunghutech.hrm.utils.TokenStore;
import com.hunghutech.hrm.data.api.ApiClient;
import com.hunghutech.hrm.data.api.AttendanceService;
import com.hunghutech.hrm.data.model.TodayResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HomeActivity extends AppCompatActivity {
    private TextView tvToday;
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        Button btnCheck = findViewById(R.id.btnCheck);
        Button btnHistory = findViewById(R.id.btnHistory);
        Button btnProfile = findViewById(R.id.btnProfile);
        Button btnLogout = findViewById(R.id.btnLogout);
        View dividerManager = findViewById(R.id.dividerManager);
        Button btnAttendanceList = findViewById(R.id.btnAttendanceList);
        Button btnEmployees = findViewById(R.id.btnEmployees);
        tvToday = findViewById(R.id.tvToday);

        btnCheck.setOnClickListener(v -> startActivity(new Intent(this, CheckInActivity.class)));
        btnHistory.setOnClickListener(v -> startActivity(new Intent(this, HistoryActivity.class)));
        btnProfile.setOnClickListener(v -> startActivity(new Intent(this, com.hunghutech.hrm.ui.profile.ProfileActivity.class)));
        btnLogout.setOnClickListener(v -> {
            TokenStore.getInstance(this).clear();
            com.hunghutech.hrm.utils.SessionStore.get(this).saveUser(null);
            startActivity(new Intent(this, LoginActivity.class));
            finish();
        });

        // Load today's status initially
        // Role gating
        String role = com.hunghutech.hrm.utils.SessionStore.get(this).getRole();
        boolean isManager = "manager".equalsIgnoreCase(role) || "admin".equalsIgnoreCase(role);
        dividerManager.setVisibility(isManager ? View.VISIBLE : View.GONE);
        btnAttendanceList.setVisibility(isManager ? View.VISIBLE : View.GONE);
        btnEmployees.setVisibility(isManager ? View.VISIBLE : View.GONE);
        btnAttendanceList.setOnClickListener(v -> startActivity(new Intent(this, com.hunghutech.hrm.ui.manager.AttendanceListActivity.class)));
        btnEmployees.setOnClickListener(v -> startActivity(new Intent(this, com.hunghutech.hrm.ui.manager.EmployeesActivity.class)));

        loadToday();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Refresh today status after returning from check-in/out
        loadToday();
    }

    private void loadToday() {
        AttendanceService svc = ApiClient.get(this).create(AttendanceService.class);
        svc.getToday().enqueue(new Callback<TodayResponse>() {
            @Override
            public void onResponse(Call<TodayResponse> call, Response<TodayResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    String st = response.body().status;
                    String text;
                    if ("checked_out".equals(st)) text = "Trạng thái hôm nay: ĐÃ CHẤM RA";
                    else if ("checked_in".equals(st)) text = "Trạng thái hôm nay: ĐÃ CHẤM VÀO";
                    else text = "Trạng thái hôm nay: VẮNG";
                    tvToday.setText(text);
                }
            }

            @Override
            public void onFailure(Call<TodayResponse> call, Throwable t) {
                // ignore
            }
        });
    }
}
