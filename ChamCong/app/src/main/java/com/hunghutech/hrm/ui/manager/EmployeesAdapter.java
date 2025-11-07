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

public class EmployeesAdapter extends RecyclerView.Adapter<EmployeesAdapter.VH> {
    private final List<JSONObject> data = new ArrayList<>();

    public void setData(JSONArray arr) {
        data.clear();
        if (arr != null) for (int i=0;i<arr.length();i++) data.add(arr.optJSONObject(i));
        notifyDataSetChanged();
    }

    @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_employee, parent, false);
        return new VH(v);
    }

    @Override public void onBindViewHolder(@NonNull VH h, int position) {
        JSONObject o = data.get(position);
        String code = o.optString("ma_nhan_vien","-");
        String name = o.optString("ho_dem"," ").trim() + " " + o.optString("ten"," ");
        h.tvName.setText(name.trim());
        h.tvCode.setText(code);
    }

    @Override public int getItemCount() { return data.size(); }

    static class VH extends RecyclerView.ViewHolder {
        TextView tvName, tvCode;
        VH(@NonNull View itemView) { super(itemView); tvName = itemView.findViewById(R.id.tvName); tvCode = itemView.findViewById(R.id.tvCode);} }
}

