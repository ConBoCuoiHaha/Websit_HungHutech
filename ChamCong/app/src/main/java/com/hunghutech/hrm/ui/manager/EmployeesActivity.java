package com.hunghutech.hrm.ui.manager;

import android.os.Bundle;
import android.view.View;
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

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class EmployeesActivity extends AppCompatActivity {
    private ProgressBar progress; private RecyclerView rv; private EmployeesAdapter adapter; private EditText etQ;
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_employees);
        progress = findViewById(R.id.progress);
        rv = findViewById(R.id.rvList);
        etQ = findViewById(R.id.etSearch);
        adapter = new EmployeesAdapter();
        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(adapter);
        findViewById(R.id.btnSearch).setOnClickListener(v -> load());
        load();
    }
    private void load() {
        progress.setVisibility(View.VISIBLE);
        AdminService svc = ApiClient.get(this).create(AdminService.class);
        svc.getEmployees(etQ.getText().toString(), 100).enqueue(new Callback<ResponseBody>() {
            @Override public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                progress.setVisibility(View.GONE);
                try {
                    if (response.isSuccessful() && response.body()!=null) {
                        JSONObject o = new JSONObject(response.body().string());
                        JSONArray arr = o.optJSONArray("data");
                        adapter.setData(arr);
                    } else {
                        Toast.makeText(EmployeesActivity.this, "Lỗi tải danh sách", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) { Toast.makeText(EmployeesActivity.this, e.getMessage(), Toast.LENGTH_SHORT).show(); }
            }
            @Override public void onFailure(Call<ResponseBody> call, Throwable t) { progress.setVisibility(View.GONE); Toast.makeText(EmployeesActivity.this, t.getMessage(), Toast.LENGTH_SHORT).show(); }
        });
    }
}

