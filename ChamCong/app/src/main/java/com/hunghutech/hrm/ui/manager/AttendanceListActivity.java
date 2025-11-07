package com.hunghutech.hrm.ui.manager;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.hunghutech.hrm.R;
import com.hunghutech.hrm.data.api.AdminService;
import com.hunghutech.hrm.data.api.ApiClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AttendanceListActivity extends AppCompatActivity {
    private ProgressBar progress;
    private RecyclerView rv;
    private AttendanceListAdapter adapter;
    private Calendar from = Calendar.getInstance();
    private Calendar to = Calendar.getInstance();
    private EditText etFrom, etTo, etSearch;
    private android.widget.CheckBox cbAllDays;
    private android.widget.Spinner spDept;
    private java.util.List<org.json.JSONObject> depts = new java.util.ArrayList<>();
    private final SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd", Locale.US);

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_attendance_list);
        progress = findViewById(R.id.progress);
        rv = findViewById(R.id.rvList);
        etFrom = findViewById(R.id.etFrom);
        etTo = findViewById(R.id.etTo);
        etSearch = findViewById(R.id.etSearch);
        cbAllDays = findViewById(R.id.cbAllDays);
        spDept = findViewById(R.id.spDept);
        Button btnFilter = findViewById(R.id.btnFilter);

        adapter = new AttendanceListAdapter();
        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(adapter);

        // Default: hôm nay
        from.set(Calendar.HOUR_OF_DAY, 0);
        from.set(Calendar.MINUTE, 0);
        from.set(Calendar.SECOND, 0);
        from.set(Calendar.MILLISECOND, 0);
        to.setTime(from.getTime());
        etFrom.setText(fmt.format(from.getTime()));
        etTo.setText(fmt.format(to.getTime()));

        etFrom.setOnClickListener(v -> pickDate(true));
        etTo.setOnClickListener(v -> pickDate(false));
        btnFilter.setOnClickListener(v -> load());

        // Admin-only: quick auto-checkout now
        String role = com.hunghutech.hrm.utils.SessionStore.get(this).getRole();
        if ("admin".equalsIgnoreCase(role)) {
            Button btnAuto = new Button(this);
            btnAuto.setText("Auto-checkout ngay (Admin)");
            ((android.widget.LinearLayout)findViewById(R.id.rootContainer)).addView(btnAuto, 4);
            btnAuto.setOnClickListener(v -> triggerAutoCheckout());
        }

        loadDepartments();
        load();
    }

    private void triggerAutoCheckout() {
        com.hunghutech.hrm.data.api.MaintenanceService ms = ApiClient.get(this).create(com.hunghutech.hrm.data.api.MaintenanceService.class);
        retrofit2.Call<okhttp3.ResponseBody> req = ms.autoCheckout();
        progress.setVisibility(View.VISIBLE);
        req.enqueue(new retrofit2.Callback<okhttp3.ResponseBody>() {
            @Override public void onResponse(retrofit2.Call<okhttp3.ResponseBody> call, retrofit2.Response<okhttp3.ResponseBody> response) {
                progress.setVisibility(View.GONE);
                try { String m = response.body()!=null?response.body().string():""; android.widget.Toast.makeText(AttendanceListActivity.this, m, android.widget.Toast.LENGTH_SHORT).show(); } catch (Exception ignored) {}
            }
            @Override public void onFailure(retrofit2.Call<okhttp3.ResponseBody> call, Throwable t) { progress.setVisibility(View.GONE); android.widget.Toast.makeText(AttendanceListActivity.this, t.getMessage(), android.widget.Toast.LENGTH_SHORT).show(); }
        });
    }

    private void pickDate(boolean isFrom) {
        Calendar c = isFrom ? from : to;
        new DatePickerDialog(this, (view, year, month, dayOfMonth) -> {
            c.set(year, month, dayOfMonth, 0, 0, 0);
            if (isFrom) etFrom.setText(fmt.format(c.getTime()));
            else etTo.setText(fmt.format(c.getTime()));
        }, c.get(Calendar.YEAR), c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH)).show();
    }

    private void load() {
        progress.setVisibility(View.VISIBLE);
        AdminService svc = ApiClient.get(this).create(AdminService.class);
        String deptId = null;
        int idx = spDept.getSelectedItemPosition();
        if (idx > 0 && idx < depts.size()+1) { // 0 = Tất cả
            deptId = depts.get(idx-1).optString("_id", null);
        }
        String q = etSearch.getText()!=null ? etSearch.getText().toString().trim() : null;
        String fromStr = (cbAllDays != null && cbAllDays.isChecked()) ? null : etFrom.getText().toString();
        String toStr = (cbAllDays != null && cbAllDays.isChecked()) ? null : etTo.getText().toString();
        svc.getAttendance(fromStr, toStr, null, deptId, 200, (q!=null && q.length()>0)? q : null)
                .enqueue(new Callback<ResponseBody>() {
                    @Override
                    public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                        progress.setVisibility(View.GONE);
                        try {
                            if (response.isSuccessful() && response.body()!=null) {
                                JSONObject o = new JSONObject(response.body().string());
                                JSONArray arr = o.optJSONArray("data");
                                adapter.setData(arr);
                            } else {
                                String err = response.errorBody()!=null?response.errorBody().string():null;
                                Toast.makeText(AttendanceListActivity.this, err!=null?err:"Lỗi tải dữ liệu", Toast.LENGTH_SHORT).show();
                            }
                        } catch (Exception e) {
                            Toast.makeText(AttendanceListActivity.this, e.getMessage(), Toast.LENGTH_SHORT).show();
                        }
                    }

                    @Override
                    public void onFailure(Call<ResponseBody> call, Throwable t) {
                        progress.setVisibility(View.GONE);
                        Toast.makeText(AttendanceListActivity.this, t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
    }

    private void loadDepartments() {
        AdminService svc = ApiClient.get(this).create(AdminService.class);
        svc.getDepartments(null, 200).enqueue(new Callback<ResponseBody>() {
            @Override public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                try {
                    if (response.isSuccessful() && response.body()!=null) {
                        JSONObject o = new JSONObject(response.body().string());
                        JSONArray arr = o.optJSONArray("data");
                        depts.clear();
                        java.util.List<String> names = new java.util.ArrayList<>();
                        names.add("Tất cả phòng ban");
                        if (arr!=null) for (int i=0;i<arr.length();i++) {
                            JSONObject d = arr.optJSONObject(i);
                            if (d!=null) { depts.add(d); names.add(d.optString("ten","(không tên)")); }
                        }
                        android.widget.ArrayAdapter<String> ad = new android.widget.ArrayAdapter<>(AttendanceListActivity.this, android.R.layout.simple_spinner_dropdown_item, names);
                        spDept.setAdapter(ad);
                    }
                } catch (Exception ignored) {}
            }
            @Override public void onFailure(Call<ResponseBody> call, Throwable t) { /* ignore */ }
        });
    }
}
