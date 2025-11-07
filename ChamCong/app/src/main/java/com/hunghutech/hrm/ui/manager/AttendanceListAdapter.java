package com.hunghutech.hrm.ui.manager;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.hunghutech.hrm.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class AttendanceListAdapter extends RecyclerView.Adapter<AttendanceListAdapter.VH> {
    private final List<JSONObject> data = new ArrayList<>();

    public void setData(JSONArray arr) {
        data.clear();
        if (arr != null) for (int i=0;i<arr.length();i++) data.add(arr.optJSONObject(i));
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_attendance_manager, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        JSONObject o = data.get(position);
        JSONObject emp = o.optJSONObject("nhan_vien_id");
        String name = emp != null ? emp.optString("ho_dem","") + " " + emp.optString("ten","") : "-";
        h.tvName.setText(name.trim().isEmpty()?"-":name);
        h.tvCode.setText(emp != null ? emp.optString("ma_nhan_vien","-") : "-");
        h.tvDate.setText(o.optString("ngay","-"));
        h.tvIn.setText(o.optString("thoi_gian_vao","-"));
        h.tvOut.setText(o.optString("thoi_gian_ra","-"));
    }

    @Override
    public int getItemCount() { return data.size(); }

    static class VH extends RecyclerView.ViewHolder {
        TextView tvName,tvCode,tvDate,tvIn,tvOut;
        VH(@NonNull View itemView) {
            super(itemView);
            tvName = itemView.findViewById(R.id.tvName);
            tvCode = itemView.findViewById(R.id.tvCode);
            tvDate = itemView.findViewById(R.id.tvDate);
            tvIn = itemView.findViewById(R.id.tvIn);
            tvOut = itemView.findViewById(R.id.tvOut);
        }
    }
}

