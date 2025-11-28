package com.hunghutech.hrm.ui.payroll;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.hunghutech.hrm.R;
import com.hunghutech.hrm.data.api.ApiClient;
import com.hunghutech.hrm.data.api.PayrollService;
import com.hunghutech.hrm.data.model.PayrollEntry;
import com.hunghutech.hrm.data.model.PayrollListResponse;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class PayrollListActivity extends AppCompatActivity {

    private RecyclerView recyclerView;
    private PayrollListAdapter adapter;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private TextView tvEmpty;
    private ChipGroup chipGroupFilter;
    private Chip chipAll, chipPending, chipConfirmed, chipRejected;

    private PayrollService payrollService;
    private List<PayrollEntry> payrollList = new ArrayList<>();
    private String currentFilter = ""; // Empty = all
    private int currentPage = 1;
    private boolean isLoading = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_payroll_list);

        // Setup toolbar
        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle("Bảng lương của tôi");
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        // Initialize views
        recyclerView = findViewById(R.id.recyclerViewPayrolls);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        progressBar = findViewById(R.id.progressBar);
        tvEmpty = findViewById(R.id.tvEmpty);
        chipGroupFilter = findViewById(R.id.chipGroupFilter);
        chipAll = findViewById(R.id.chipAll);
        chipPending = findViewById(R.id.chipPending);
        chipConfirmed = findViewById(R.id.chipConfirmed);
        chipRejected = findViewById(R.id.chipRejected);

        // Setup RecyclerView
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new PayrollListAdapter(payrollList, this::onPayrollItemClick);
        recyclerView.setAdapter(adapter);

        // Setup API service
        payrollService = ApiClient.getInstance(this).create(PayrollService.class);

        // Setup filter chips
        chipGroupFilter.setOnCheckedStateChangeListener((group, checkedIds) -> {
            if (checkedIds.isEmpty()) {
                chipAll.setChecked(true);
                return;
            }

            int checkedId = checkedIds.get(0);
            if (checkedId == R.id.chipAll) {
                currentFilter = "";
            } else if (checkedId == R.id.chipPending) {
                currentFilter = "Cho_xac_nhan";
            } else if (checkedId == R.id.chipConfirmed) {
                currentFilter = "Da_xac_nhan";
            } else if (checkedId == R.id.chipRejected) {
                currentFilter = "Tu_choi";
            }

            // Reload with new filter
            currentPage = 1;
            payrollList.clear();
            loadPayrolls();
        });

        // Setup swipe refresh
        swipeRefresh.setOnRefreshListener(() -> {
            currentPage = 1;
            payrollList.clear();
            loadPayrolls();
        });

        // Initial load
        chipAll.setChecked(true);
        loadPayrolls();
    }

    private void loadPayrolls() {
        if (isLoading) return;
        isLoading = true;

        if (currentPage == 1) {
            progressBar.setVisibility(View.VISIBLE);
            recyclerView.setVisibility(View.GONE);
            tvEmpty.setVisibility(View.GONE);
        }

        Call<PayrollListResponse> call = payrollService.getMyPendingPayrolls(
                currentFilter.isEmpty() ? null : currentFilter,
                20,
                currentPage
        );

        call.enqueue(new Callback<PayrollListResponse>() {
            @Override
            public void onResponse(Call<PayrollListResponse> call, Response<PayrollListResponse> response) {
                isLoading = false;
                swipeRefresh.setRefreshing(false);
                progressBar.setVisibility(View.GONE);

                if (response.isSuccessful() && response.body() != null) {
                    PayrollListResponse result = response.body();
                    if (result.success && result.data != null) {
                        payrollList.addAll(result.data);
                        adapter.notifyDataSetChanged();

                        if (payrollList.isEmpty()) {
                            tvEmpty.setVisibility(View.VISIBLE);
                            recyclerView.setVisibility(View.GONE);
                        } else {
                            tvEmpty.setVisibility(View.GONE);
                            recyclerView.setVisibility(View.VISIBLE);
                        }
                    } else {
                        showError(result.msg != null ? result.msg : "Không có dữ liệu");
                    }
                } else {
                    String errorMsg = "Lỗi " + response.code();
                    try {
                        if (response.errorBody() != null) {
                            errorMsg += ": " + response.errorBody().string();
                        }
                    } catch (Exception e) {
                        errorMsg += " (không đọc được chi tiết)";
                    }
                    android.util.Log.e("PayrollList", "API Error: " + errorMsg);
                    showError(errorMsg);
                }
            }

            @Override
            public void onFailure(Call<PayrollListResponse> call, Throwable t) {
                isLoading = false;
                swipeRefresh.setRefreshing(false);
                progressBar.setVisibility(View.GONE);
                String errorMsg = "Lỗi kết nối: " + t.getMessage();
                android.util.Log.e("PayrollList", "Network Error: " + errorMsg, t);
                showError(errorMsg);
            }
        });
    }

    private void onPayrollItemClick(PayrollEntry entry) {
        Intent intent = new Intent(this, PayrollDetailActivity.class);
        intent.putExtra("entry_id", entry._id);
        intent.putExtra("run_id", entry.run_id);
        startActivity(intent);
    }

    private void showError(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
        if (payrollList.isEmpty()) {
            tvEmpty.setText(message);
            tvEmpty.setVisibility(View.VISIBLE);
            recyclerView.setVisibility(View.GONE);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Reload when returning from detail (in case status changed)
        currentPage = 1;
        payrollList.clear();
        loadPayrolls();
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }
}
