package com.hunghutech.hrm.ui.payroll;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.RecyclerView;

import com.hunghutech.hrm.R;
import com.hunghutech.hrm.data.model.PayrollEntry;
import com.hunghutech.hrm.utils.CurrencyHelper;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class PayrollListAdapter extends RecyclerView.Adapter<PayrollListAdapter.PayrollViewHolder> {

    private List<PayrollEntry> payrollList;
    private OnPayrollClickListener listener;

    public interface OnPayrollClickListener {
        void onPayrollClick(PayrollEntry entry);
    }

    public PayrollListAdapter(List<PayrollEntry> payrollList, OnPayrollClickListener listener) {
        this.payrollList = payrollList;
        this.listener = listener;
    }

    @NonNull
    @Override
    public PayrollViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_payroll, parent, false);
        return new PayrollViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull PayrollViewHolder holder, int position) {
        PayrollEntry entry = payrollList.get(position);
        holder.bind(entry, listener);
    }

    @Override
    public int getItemCount() {
        return payrollList.size();
    }

    static class PayrollViewHolder extends RecyclerView.ViewHolder {
        private CardView cardView;
        private TextView tvKyLuong;
        private TextView tvPeriod;
        private TextView tvAmount;
        private TextView tvStatus;
        private TextView tvDeadline;
        private ImageView ivStatusIcon;

        public PayrollViewHolder(@NonNull View itemView) {
            super(itemView);
            cardView = (CardView) itemView;
            tvKyLuong = itemView.findViewById(R.id.tvKyLuong);
            tvPeriod = itemView.findViewById(R.id.tvPeriod);
            tvAmount = itemView.findViewById(R.id.tvAmount);
            tvStatus = itemView.findViewById(R.id.tvStatus);
            tvDeadline = itemView.findViewById(R.id.tvDeadline);
            ivStatusIcon = itemView.findViewById(R.id.ivStatusIcon);
        }

        public void bind(PayrollEntry entry, OnPayrollClickListener listener) {
            // Ky luong
            tvKyLuong.setText("Kỳ lương: " + entry.ky_luong);

            // Period
            String period = formatDate(entry.ngay_bat_dau) + " - " + formatDate(entry.ngay_ket_thuc);
            tvPeriod.setText(period);

            // Amount
            tvAmount.setText(CurrencyHelper.formatVND(entry.luong_thuc_nhan));

            // Status
            String status = entry.trang_thai_xac_nhan;
            if (status == null) status = "Chua_gui";

            switch (status) {
                case "Cho_xac_nhan":
                    tvStatus.setText("Chờ xác nhận");
                    tvStatus.setTextColor(Color.parseColor("#FF9800")); // Orange
                    ivStatusIcon.setImageResource(R.drawable.ic_pending);
                    ivStatusIcon.setColorFilter(Color.parseColor("#FF9800"));

                    // Show deadline
                    if (entry.gui_xac_nhan != null && entry.gui_xac_nhan.deadline != null) {
                        String deadlineText = "Hạn xác nhận: " + formatDate(entry.gui_xac_nhan.deadline);
                        tvDeadline.setText(deadlineText);
                        tvDeadline.setVisibility(View.VISIBLE);

                        // Check if overdue
                        if (isOverdue(entry.gui_xac_nhan.deadline)) {
                            tvDeadline.setTextColor(Color.parseColor("#F44336")); // Red
                            tvDeadline.setText(deadlineText + " (Quá hạn)");
                        } else {
                            tvDeadline.setTextColor(Color.parseColor("#666666"));
                        }
                    } else {
                        tvDeadline.setVisibility(View.GONE);
                    }
                    break;

                case "Da_xac_nhan":
                    tvStatus.setText("Đã xác nhận");
                    tvStatus.setTextColor(Color.parseColor("#4CAF50")); // Green
                    ivStatusIcon.setImageResource(R.drawable.ic_check_circle);
                    ivStatusIcon.setColorFilter(Color.parseColor("#4CAF50"));
                    tvDeadline.setVisibility(View.GONE);

                    if (entry.xac_nhan != null && entry.xac_nhan.ngay_xac_nhan != null) {
                        tvDeadline.setText("Xác nhận: " + formatDate(entry.xac_nhan.ngay_xac_nhan));
                        tvDeadline.setVisibility(View.VISIBLE);
                        tvDeadline.setTextColor(Color.parseColor("#4CAF50"));
                    }
                    break;

                case "Tu_choi":
                    tvStatus.setText("Từ chối");
                    tvStatus.setTextColor(Color.parseColor("#F44336")); // Red
                    ivStatusIcon.setImageResource(R.drawable.ic_cancel);
                    ivStatusIcon.setColorFilter(Color.parseColor("#F44336"));

                    if (entry.tu_choi != null) {
                        if (entry.tu_choi.da_xu_ly) {
                            tvDeadline.setText("Đã xử lý");
                            tvDeadline.setTextColor(Color.parseColor("#4CAF50"));
                        } else {
                            tvDeadline.setText("Chờ xử lý");
                            tvDeadline.setTextColor(Color.parseColor("#F44336"));
                        }
                        tvDeadline.setVisibility(View.VISIBLE);
                    } else {
                        tvDeadline.setVisibility(View.GONE);
                    }
                    break;

                default:
                    tvStatus.setText("Chưa gửi");
                    tvStatus.setTextColor(Color.parseColor("#9E9E9E")); // Gray
                    ivStatusIcon.setImageResource(R.drawable.ic_info);
                    ivStatusIcon.setColorFilter(Color.parseColor("#9E9E9E"));
                    tvDeadline.setVisibility(View.GONE);
                    break;
            }

            // Click listener
            cardView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onPayrollClick(entry);
                }
            });
        }

        private String formatDate(String dateStr) {
            if (dateStr == null || dateStr.isEmpty()) return "";
            try {
                SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                SimpleDateFormat outputFormat = new SimpleDateFormat("dd/MM/yyyy", Locale.US);
                Date date = inputFormat.parse(dateStr);
                return date != null ? outputFormat.format(date) : dateStr;
            } catch (ParseException e) {
                return dateStr;
            }
        }

        private boolean isOverdue(String deadlineStr) {
            if (deadlineStr == null || deadlineStr.isEmpty()) return false;
            try {
                SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                Date deadline = format.parse(deadlineStr);
                Date now = new Date();
                return deadline != null && now.after(deadline);
            } catch (ParseException e) {
                return false;
            }
        }
    }
}
