package com.hunghutech.hrm.ui.attendance;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.hunghutech.hrm.R;
import com.hunghutech.hrm.data.api.ApiClient;
import com.hunghutech.hrm.data.api.AttendanceService;
import com.hunghutech.hrm.data.model.HistoryResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HistoryActivity extends AppCompatActivity {
    private HistoryAdapter adapter;
    private ProgressBar progress;
    private TextView tvMonth;
    private java.util.Calendar current;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_history);
        RecyclerView rv = findViewById(R.id.rvHistory);
        progress = findViewById(R.id.progress);
        tvMonth = findViewById(R.id.tvMonth);
        Button btnPick = findViewById(R.id.btnPickMonth);
        adapter = new HistoryAdapter();
        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(adapter);

        current = java.util.Calendar.getInstance();
        updateMonthTitle();
        load();

        btnPick.setOnClickListener(v -> pickMonth());
    }

    private void pickMonth() {
        int y = current.get(java.util.Calendar.YEAR);
        int m = current.get(java.util.Calendar.MONTH);
        DatePickerDialog dlg = new DatePickerDialog(this, (view, year, month, dayOfMonth) -> {
            current.set(java.util.Calendar.YEAR, year);
            current.set(java.util.Calendar.MONTH, month);
            current.set(java.util.Calendar.DAY_OF_MONTH, 1);
            updateMonthTitle();
            load();
        }, y, m, 1);
        dlg.show();
    }

    private void updateMonthTitle() {
        java.text.SimpleDateFormat fmt = new java.text.SimpleDateFormat("MM/yyyy", java.util.Locale.getDefault());
        tvMonth.setText("Tháng: " + fmt.format(current.getTime()));
    }

    private void load() {
        progress.setVisibility(View.VISIBLE);
        AttendanceService svc = ApiClient.get(this).create(AttendanceService.class);
        String[] range = monthRange(current);
        svc.getHistory(range[0], range[1], 200).enqueue(new Callback<HistoryResponse>() {
            @Override
            public void onResponse(Call<HistoryResponse> call, Response<HistoryResponse> response) {
                progress.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    adapter.setData(response.body().data);
                }
            }

            @Override
            public void onFailure(Call<HistoryResponse> call, Throwable t) {
                progress.setVisibility(View.GONE);
            }
        });
    }

    private static String[] monthRange(java.util.Calendar cal) {
        java.text.SimpleDateFormat iso = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US);
        java.util.Calendar start = (java.util.Calendar) cal.clone();
        start.set(java.util.Calendar.DAY_OF_MONTH, 1);
        start.set(java.util.Calendar.HOUR_OF_DAY, 0);
        start.set(java.util.Calendar.MINUTE, 0);
        start.set(java.util.Calendar.SECOND, 0);
        start.set(java.util.Calendar.MILLISECOND, 0);

        java.util.Calendar end = (java.util.Calendar) start.clone();
        end.set(java.util.Calendar.DAY_OF_MONTH, end.getActualMaximum(java.util.Calendar.DAY_OF_MONTH));
        return new String[]{ iso.format(start.getTime()), iso.format(end.getTime()) };
    }
}
