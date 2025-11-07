package com.hunghutech.hrm.ui.attendance;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.hunghutech.hrm.R;
import com.hunghutech.hrm.data.model.HistoryResponse;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class HistoryAdapter extends RecyclerView.Adapter<HistoryAdapter.VH> {
    private final List<HistoryResponse.Item> items = new ArrayList<>();
    private final SimpleDateFormat dd = new SimpleDateFormat("dd/MM/yyyy", Locale.getDefault());
    private final SimpleDateFormat outTime = new SimpleDateFormat("HH:mm", Locale.getDefault());
    private final SimpleDateFormat isoMillis = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
    private final SimpleDateFormat isoNoMillis = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);

    public HistoryAdapter() {
        java.util.TimeZone utc = java.util.TimeZone.getTimeZone("UTC");
        isoMillis.setTimeZone(utc);
        isoNoMillis.setTimeZone(utc);
    }

    public void setData(List<HistoryResponse.Item> data) {
        items.clear();
        if (data != null) items.addAll(data);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_history, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        HistoryResponse.Item it = items.get(position);
        // Date label
        String d = it.ngay;
        if (d != null && d.length() >= 10) {
            String y = d.substring(0, 4), m = d.substring(5, 7), day = d.substring(8, 10);
            h.tvDate.setText(day + "/" + m + "/" + y);
        } else {
            h.tvDate.setText(d != null ? d : "-");
        }

        java.util.Date in = parseIso(it.thoi_gian_vao);
        java.util.Date out = parseIso(it.thoi_gian_ra);
        String inStr = in != null ? outTime.format(in) : "-";
        String outStr = out != null ? outTime.format(out) : "-";
        h.tvTimes.setText("Vào: " + inStr + (out != null ? ("  •  Ra: " + outStr) : ""));

        // Status: đúng giờ / trễ / không chấm công (>30')
        String status;
        int color;
        if (in == null) {
            status = "Không chấm công";
            color = android.graphics.Color.parseColor("#E74C3C");
        } else {
            java.util.Calendar cal = java.util.Calendar.getInstance();
            if (in != null) cal.setTime(in);
            // Threshold 08:30 local
            java.util.Calendar threshold = java.util.Calendar.getInstance();
            if (d != null && d.length() >= 10) {
                try {
                    int year = Integer.parseInt(d.substring(0,4));
                    int month = Integer.parseInt(d.substring(5,7)) - 1;
                    int day = Integer.parseInt(d.substring(8,10));
                    threshold.set(year, month, day, 8, 30, 0);
                    threshold.set(java.util.Calendar.MILLISECOND, 0);
                } catch (Exception ignored) { threshold.setTime(in); }
            } else threshold.setTime(in);

            long diffMin = (in.getTime() - threshold.getTimeInMillis()) / (60 * 1000);
            if (diffMin <= 5) { // grace 5'
                status = "Đúng giờ";
                color = android.graphics.Color.parseColor("#27AE60");
            } else if (diffMin <= 30) {
                status = "Trễ " + diffMin + " phút";
                color = android.graphics.Color.parseColor("#F39C12");
            } else {
                status = "Không chấm công (trễ > 30')";
                color = android.graphics.Color.parseColor("#E74C3C");
            }
        }
        h.tvStatus.setText(status);
        h.tvStatus.setTextColor(color);
    }

    private java.util.Date parseIso(String s) {
        if (s == null) return null;
        try { return isoMillis.parse(s); } catch (Exception ignored) {}
        try { return isoNoMillis.parse(s); } catch (Exception ignored) {}
        return null;
    }

    @Override
    public int getItemCount() { return items.size(); }

    static class VH extends RecyclerView.ViewHolder {
        TextView tvDate, tvTimes, tvStatus;
        VH(@NonNull View itemView) {
            super(itemView);
            tvDate = itemView.findViewById(R.id.tvDate);
            tvTimes = itemView.findViewById(R.id.tvTimes);
            tvStatus = itemView.findViewById(R.id.tvStatus);
        }
    }
}
