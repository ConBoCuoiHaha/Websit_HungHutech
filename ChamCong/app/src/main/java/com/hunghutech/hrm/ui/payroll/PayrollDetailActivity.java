package com.hunghutech.hrm.ui.payroll;

import android.app.AlertDialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;

import com.google.android.material.card.MaterialCardView;
import com.hunghutech.hrm.R;
import com.hunghutech.hrm.data.api.ApiClient;
import com.hunghutech.hrm.data.api.PayrollService;
import com.hunghutech.hrm.data.model.ConfirmRequest;
import com.hunghutech.hrm.data.model.PayrollEntry;
import com.hunghutech.hrm.data.model.PayrollListResponse;
import com.hunghutech.hrm.data.model.PayrollResponse;
import com.hunghutech.hrm.data.model.RejectRequest;
import com.hunghutech.hrm.utils.BiometricHelper;
import com.hunghutech.hrm.utils.CurrencyHelper;

import java.security.MessageDigest;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Executor;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class PayrollDetailActivity extends AppCompatActivity {

    private String entryId;
    private String runId;
    private PayrollEntry currentEntry;
    private PayrollService payrollService;

    // Views
    private ProgressBar progressBar;
    private ScrollView layoutContent;
    private TextView tvEmpty;

    // Header
    private TextView tvKyLuong, tvPeriod, tvStatus, tvDeadline;

    // Income section
    private TextView tvLuongCoBan, tvTongPhuCap, tvTongThuong, tvTongOt, tvTongThuNhap;
    private LinearLayout layoutPhuCapList, layoutThuongList, layoutOtList;

    // Deduction section
    private TextView tvBHXH, tvBHYT, tvBHTN, tvKPCD, tvTongKhauTruBatBuoc;
    private TextView tvGiamTruBanThan, tvGiamTruPhuThuoc, tvThuNhapTinhThue, tvThueTNCN;
    private TextView tvTongKhauTruKhac, tvTongKhauTru;
    private LinearLayout layoutKhauTruKhacList, layoutChiTietThueList;

    // Final
    private TextView tvLuongThucNhan;

    // Action buttons
    private MaterialCardView cardActions;
    private Button btnConfirm, btnReject;

    // Confirmation info
    private MaterialCardView cardConfirmInfo;
    private TextView tvConfirmInfo;

    // Rejection info
    private MaterialCardView cardRejectInfo;
    private TextView tvRejectReason, tvRejectNote, tvRejectStatus;

    private Executor executor;
    private BiometricPrompt biometricPrompt;
    private BiometricPrompt.PromptInfo promptInfo;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_payroll_detail);

        // Get data from intent
        entryId = getIntent().getStringExtra("entry_id");
        runId = getIntent().getStringExtra("run_id");

        if (entryId == null || runId == null) {
            Toast.makeText(this, "Lỗi: Thiếu thông tin bảng lương", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // Setup toolbar
        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle("Chi tiết bảng lương");
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        // Initialize views
        initViews();

        // Setup API service
        payrollService = ApiClient.getInstance(this).create(PayrollService.class);

        // Setup biometric
        setupBiometric();

        // Load payroll detail
        loadPayrollDetail();
    }

    private void initViews() {
        progressBar = findViewById(R.id.progressBar);
        layoutContent = findViewById(R.id.layoutContent);
        tvEmpty = findViewById(R.id.tvEmpty);

        // Header
        tvKyLuong = findViewById(R.id.tvKyLuong);
        tvPeriod = findViewById(R.id.tvPeriod);
        tvStatus = findViewById(R.id.tvStatus);
        tvDeadline = findViewById(R.id.tvDeadline);

        // Income
        tvLuongCoBan = findViewById(R.id.tvLuongCoBan);
        tvTongPhuCap = findViewById(R.id.tvTongPhuCap);
        tvTongThuong = findViewById(R.id.tvTongThuong);
        tvTongOt = findViewById(R.id.tvTongOt);
        tvTongThuNhap = findViewById(R.id.tvTongThuNhap);
        layoutPhuCapList = findViewById(R.id.layoutPhuCapList);
        layoutThuongList = findViewById(R.id.layoutThuongList);
        layoutOtList = findViewById(R.id.layoutOtList);

        // Deduction
        tvBHXH = findViewById(R.id.tvBHXH);
        tvBHYT = findViewById(R.id.tvBHYT);
        tvBHTN = findViewById(R.id.tvBHTN);
        tvKPCD = findViewById(R.id.tvKPCD);
        tvTongKhauTruBatBuoc = findViewById(R.id.tvTongKhauTruBatBuoc);
        tvGiamTruBanThan = findViewById(R.id.tvGiamTruBanThan);
        tvGiamTruPhuThuoc = findViewById(R.id.tvGiamTruPhuThuoc);
        tvThuNhapTinhThue = findViewById(R.id.tvThuNhapTinhThue);
        tvThueTNCN = findViewById(R.id.tvThueTNCN);
        tvTongKhauTruKhac = findViewById(R.id.tvTongKhauTruKhac);
        tvTongKhauTru = findViewById(R.id.tvTongKhauTru);
        layoutKhauTruKhacList = findViewById(R.id.layoutKhauTruKhacList);
        layoutChiTietThueList = findViewById(R.id.layoutChiTietThueList);

        // Final
        tvLuongThucNhan = findViewById(R.id.tvLuongThucNhan);

        // Actions
        cardActions = findViewById(R.id.cardActions);
        btnConfirm = findViewById(R.id.btnConfirm);
        btnReject = findViewById(R.id.btnReject);

        // Confirmation info
        cardConfirmInfo = findViewById(R.id.cardConfirmInfo);
        tvConfirmInfo = findViewById(R.id.tvConfirmInfo);

        // Rejection info
        cardRejectInfo = findViewById(R.id.cardRejectInfo);
        tvRejectReason = findViewById(R.id.tvRejectReason);
        tvRejectNote = findViewById(R.id.tvRejectNote);
        tvRejectStatus = findViewById(R.id.tvRejectStatus);

        // Button listeners
        btnConfirm.setOnClickListener(v -> confirmPayroll());
        btnReject.setOnClickListener(v -> showRejectDialog());
    }

    private void setupBiometric() {
        executor = ContextCompat.getMainExecutor(this);
        biometricPrompt = new BiometricPrompt(this, executor, new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                super.onAuthenticationSucceeded(result);
                // Generate biometric signature hash
                String signature = generateBiometricSignature();
                sendConfirmation(signature);
            }

            @Override
            public void onAuthenticationError(int errorCode, CharSequence errString) {
                super.onAuthenticationError(errorCode, errString);
                Toast.makeText(PayrollDetailActivity.this,
                        "Xác thực thất bại: " + errString, Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onAuthenticationFailed() {
                super.onAuthenticationFailed();
                Toast.makeText(PayrollDetailActivity.this,
                        "Xác thực thất bại", Toast.LENGTH_SHORT).show();
            }
        });

        promptInfo = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("Xác nhận bảng lương")
                .setSubtitle("Sử dụng vân tay để xác nhận bảng lương của bạn")
                .setNegativeButtonText("Hủy")
                .build();
    }

    private void loadPayrollDetail() {
        progressBar.setVisibility(View.VISIBLE);
        layoutContent.setVisibility(View.GONE);
        tvEmpty.setVisibility(View.GONE);

        // Load all payrolls and find this one
        Call<PayrollListResponse> call = payrollService.getMyPendingPayrolls(null, 100, 1);
        call.enqueue(new Callback<PayrollListResponse>() {
            @Override
            public void onResponse(Call<PayrollListResponse> call, Response<PayrollListResponse> response) {
                progressBar.setVisibility(View.GONE);

                if (response.isSuccessful() && response.body() != null) {
                    PayrollListResponse result = response.body();
                    if (result.success && result.data != null) {
                        // Find the entry
                        for (PayrollEntry entry : result.data) {
                            if (entry._id.equals(entryId)) {
                                currentEntry = entry;
                                displayPayrollDetail(entry);
                                return;
                            }
                        }
                        showError("Không tìm thấy bảng lương");
                    } else {
                        showError(result.msg != null ? result.msg : "Không có dữ liệu");
                    }
                } else {
                    showError("Lỗi kết nối: " + response.code());
                }
            }

            @Override
            public void onFailure(Call<PayrollListResponse> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                showError("Lỗi kết nối: " + t.getMessage());
            }
        });
    }

    private void displayPayrollDetail(PayrollEntry entry) {
        layoutContent.setVisibility(View.VISIBLE);

        // Header
        tvKyLuong.setText(entry.ky_luong);
        String period = formatDate(entry.ngay_bat_dau) + " - " + formatDate(entry.ngay_ket_thuc);
        tvPeriod.setText(period);

        // Status
        updateStatusUI(entry);

        // Income section
        tvLuongCoBan.setText(CurrencyHelper.formatVND(entry.luong_co_ban));
        tvTongPhuCap.setText(CurrencyHelper.formatVND(entry.tong_phu_cap));
        tvTongThuong.setText(CurrencyHelper.formatVND(entry.tong_thuong));
        tvTongOt.setText(CurrencyHelper.formatVND(entry.tong_ot));
        tvTongThuNhap.setText(CurrencyHelper.formatVND(entry.tong_thu_nhap));

        // Populate lists
        populateMoneyList(layoutPhuCapList, entry.phu_cap);
        populateMoneyList(layoutThuongList, entry.thuong);
        populateMoneyList(layoutOtList, entry.ot);

        // Deduction section
        tvBHXH.setText(CurrencyHelper.formatVND(entry.bhxh));
        tvBHYT.setText(CurrencyHelper.formatVND(entry.bhyt));
        tvBHTN.setText(CurrencyHelper.formatVND(entry.bhtn));
        tvKPCD.setText(CurrencyHelper.formatVND(entry.kpcd));
        tvTongKhauTruBatBuoc.setText(CurrencyHelper.formatVND(entry.tong_khau_tru_bat_buoc));

        tvGiamTruBanThan.setText(CurrencyHelper.formatVND(entry.giam_tru_ban_than));
        String phuThuocText = CurrencyHelper.formatVND(entry.giam_tru_phu_thuoc) +
                " (" + entry.so_nguoi_phu_thuoc + " người)";
        tvGiamTruPhuThuoc.setText(phuThuocText);
        tvThuNhapTinhThue.setText(CurrencyHelper.formatVND(entry.thu_nhap_tinh_thue));
        tvThueTNCN.setText(CurrencyHelper.formatVND(entry.thue_tncn));

        tvTongKhauTruKhac.setText(CurrencyHelper.formatVND(entry.tong_khau_tru_khac));
        tvTongKhauTru.setText(CurrencyHelper.formatVND(entry.tong_khau_tru));

        populateMoneyList(layoutKhauTruKhacList, entry.khoan_khau_tru);
        populateTaxBreakdown(layoutChiTietThueList, entry.chi_tiet_thue);

        // Final
        tvLuongThucNhan.setText(CurrencyHelper.formatVND(entry.luong_thuc_nhan));
    }

    private void updateStatusUI(PayrollEntry entry) {
        String status = entry.trang_thai_xac_nhan;
        if (status == null) status = "Chua_gui";

        switch (status) {
            case "Cho_xac_nhan":
                tvStatus.setText("⏱ Chờ xác nhận");
                tvStatus.setTextColor(getColor(R.color.orange));
                cardActions.setVisibility(View.VISIBLE);
                cardConfirmInfo.setVisibility(View.GONE);
                cardRejectInfo.setVisibility(View.GONE);

                if (entry.gui_xac_nhan != null && entry.gui_xac_nhan.deadline != null) {
                    String deadlineText = "Hạn xác nhận: " + formatDate(entry.gui_xac_nhan.deadline);
                    tvDeadline.setText(deadlineText);
                    tvDeadline.setVisibility(View.VISIBLE);

                    if (isOverdue(entry.gui_xac_nhan.deadline)) {
                        tvDeadline.setTextColor(getColor(R.color.red));
                        tvDeadline.setText(deadlineText + " (Quá hạn)");
                    } else {
                        tvDeadline.setTextColor(getColor(R.color.gray_dark));
                    }
                } else {
                    tvDeadline.setVisibility(View.GONE);
                }
                break;

            case "Da_xac_nhan":
                tvStatus.setText("✓ Đã xác nhận");
                tvStatus.setTextColor(getColor(R.color.green));
                cardActions.setVisibility(View.GONE);
                cardRejectInfo.setVisibility(View.GONE);

                if (entry.xac_nhan != null) {
                    cardConfirmInfo.setVisibility(View.VISIBLE);
                    String info = "Đã xác nhận vào: " + formatDate(entry.xac_nhan.ngay_xac_nhan);
                    if (entry.xac_nhan.device_info != null && !entry.xac_nhan.device_info.isEmpty()) {
                        info += "\nThiết bị: " + entry.xac_nhan.device_info;
                    }
                    tvConfirmInfo.setText(info);
                    tvDeadline.setVisibility(View.GONE);
                } else {
                    cardConfirmInfo.setVisibility(View.GONE);
                }
                break;

            case "Tu_choi":
                tvStatus.setText("✗ Từ chối");
                tvStatus.setTextColor(getColor(R.color.red));
                cardActions.setVisibility(View.GONE);
                cardConfirmInfo.setVisibility(View.GONE);

                if (entry.tu_choi != null) {
                    cardRejectInfo.setVisibility(View.VISIBLE);
                    tvRejectReason.setText("Lý do: " + entry.tu_choi.ly_do);

                    if (entry.tu_choi.ghi_chu != null && !entry.tu_choi.ghi_chu.isEmpty()) {
                        tvRejectNote.setText("Ghi chú: " + entry.tu_choi.ghi_chu);
                        tvRejectNote.setVisibility(View.VISIBLE);
                    } else {
                        tvRejectNote.setVisibility(View.GONE);
                    }

                    if (entry.tu_choi.da_xu_ly) {
                        tvRejectStatus.setText("✓ Đã xử lý");
                        tvRejectStatus.setTextColor(getColor(R.color.green));
                        if (entry.tu_choi.ket_qua_xu_ly != null) {
                            tvRejectStatus.setText(tvRejectStatus.getText() + ": " + entry.tu_choi.ket_qua_xu_ly);
                        }
                    } else {
                        tvRejectStatus.setText("⏱ Chờ xử lý");
                        tvRejectStatus.setTextColor(getColor(R.color.orange));
                    }

                    tvDeadline.setVisibility(View.GONE);
                } else {
                    cardRejectInfo.setVisibility(View.GONE);
                }
                break;

            default:
                tvStatus.setText("Chưa gửi");
                tvStatus.setTextColor(getColor(R.color.gray));
                cardActions.setVisibility(View.GONE);
                cardConfirmInfo.setVisibility(View.GONE);
                cardRejectInfo.setVisibility(View.GONE);
                tvDeadline.setVisibility(View.GONE);
                break;
        }
    }

    private void populateMoneyList(LinearLayout container, List<PayrollEntry.MoneyItem> items) {
        container.removeAllViews();
        if (items == null || items.isEmpty()) {
            TextView tv = new TextView(this);
            tv.setText("Không có");
            tv.setTextColor(getColor(R.color.gray));
            tv.setPadding(0, 4, 0, 4);
            container.addView(tv);
            return;
        }

        for (PayrollEntry.MoneyItem item : items) {
            View itemView = LayoutInflater.from(this).inflate(R.layout.item_money_row, container, false);
            TextView tvName = itemView.findViewById(R.id.tvName);
            TextView tvAmount = itemView.findViewById(R.id.tvAmount);

            tvName.setText(item.ten);
            tvAmount.setText(CurrencyHelper.formatVND(item.so_tien));

            container.addView(itemView);
        }
    }

    private void populateTaxBreakdown(LinearLayout container, List<PayrollEntry.TaxBreakdown> items) {
        container.removeAllViews();
        if (items == null || items.isEmpty()) {
            TextView tv = new TextView(this);
            tv.setText("Không có");
            tv.setTextColor(getColor(R.color.gray));
            tv.setPadding(0, 4, 0, 4);
            container.addView(tv);
            return;
        }

        for (PayrollEntry.TaxBreakdown item : items) {
            View itemView = LayoutInflater.from(this).inflate(R.layout.item_tax_row, container, false);
            TextView tvBac = itemView.findViewById(R.id.tvBac);
            TextView tvMuc = itemView.findViewById(R.id.tvMuc);
            TextView tvThue = itemView.findViewById(R.id.tvThue);

            tvBac.setText("Bậc " + item.bac + " (" + CurrencyHelper.formatPercent(item.thue_suat) + ")");
            tvMuc.setText(CurrencyHelper.formatVND(item.muc_chiu_thue));
            tvThue.setText(CurrencyHelper.formatVND(item.tien_thue));

            container.addView(itemView);
        }
    }

    private void confirmPayroll() {
        // Check if biometric is available
        if (!BiometricHelper.isBiometricAvailable(this)) {
            Toast.makeText(this, "Thiết bị không hỗ trợ xác thực vân tay", Toast.LENGTH_SHORT).show();
            return;
        }

        // Show biometric prompt
        biometricPrompt.authenticate(promptInfo);
    }

    private String generateBiometricSignature() {
        try {
            String data = entryId + "_" + System.currentTimeMillis();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return "biometric_" + System.currentTimeMillis();
        }
    }

    private void sendConfirmation(String signature) {
        String deviceInfo = android.os.Build.MANUFACTURER + " " + android.os.Build.MODEL;
        String osVersion = "Android " + android.os.Build.VERSION.RELEASE;
        String appVersion = "1.0"; // App version
        ConfirmRequest request = new ConfirmRequest(signature, deviceInfo, osVersion, appVersion);

        Call<PayrollResponse> call = payrollService.confirmPayroll(entryId, request);
        call.enqueue(new Callback<PayrollResponse>() {
            @Override
            public void onResponse(Call<PayrollResponse> call, Response<PayrollResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    PayrollResponse result = response.body();
                    if (result.success) {
                        Toast.makeText(PayrollDetailActivity.this,
                                "Xác nhận bảng lương thành công!", Toast.LENGTH_SHORT).show();
                        // Reload to update UI
                        loadPayrollDetail();
                    } else {
                        Toast.makeText(PayrollDetailActivity.this,
                                "Lỗi: " + result.msg, Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(PayrollDetailActivity.this,
                            "Lỗi kết nối: " + response.code(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<PayrollResponse> call, Throwable t) {
                Toast.makeText(PayrollDetailActivity.this,
                        "Lỗi kết nối: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void showRejectDialog() {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_reject, null);
        EditText etReason = dialogView.findViewById(R.id.etReason);
        EditText etNote = dialogView.findViewById(R.id.etNote);

        new AlertDialog.Builder(this)
                .setTitle("Từ chối bảng lương")
                .setView(dialogView)
                .setPositiveButton("Gửi", (dialog, which) -> {
                    String reason = etReason.getText().toString().trim();
                    String note = etNote.getText().toString().trim();

                    if (reason.isEmpty() || reason.length() < 10) {
                        Toast.makeText(this, "Lý do phải có ít nhất 10 ký tự", Toast.LENGTH_SHORT).show();
                        return;
                    }

                    sendRejection(reason, note);
                })
                .setNegativeButton("Hủy", null)
                .show();
    }

    private void sendRejection(String reason, String note) {
        String deviceInfo = android.os.Build.MANUFACTURER + " " + android.os.Build.MODEL;
        RejectRequest request = new RejectRequest(reason, note, deviceInfo);

        Call<PayrollResponse> call = payrollService.rejectPayroll(entryId, request);
        call.enqueue(new Callback<PayrollResponse>() {
            @Override
            public void onResponse(Call<PayrollResponse> call, Response<PayrollResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    PayrollResponse result = response.body();
                    if (result.success) {
                        Toast.makeText(PayrollDetailActivity.this,
                                "Đã gửi yêu cầu từ chối", Toast.LENGTH_SHORT).show();
                        // Reload to update UI
                        loadPayrollDetail();
                    } else {
                        Toast.makeText(PayrollDetailActivity.this,
                                "Lỗi: " + result.msg, Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(PayrollDetailActivity.this,
                            "Lỗi kết nối: " + response.code(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<PayrollResponse> call, Throwable t) {
                Toast.makeText(PayrollDetailActivity.this,
                        "Lỗi kết nối: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void showError(String message) {
        tvEmpty.setText(message);
        tvEmpty.setVisibility(View.VISIBLE);
        layoutContent.setVisibility(View.GONE);
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

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }
}
