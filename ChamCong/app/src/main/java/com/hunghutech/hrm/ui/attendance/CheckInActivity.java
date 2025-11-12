package com.hunghutech.hrm.ui.attendance;

import android.location.Location;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.hunghutech.hrm.R;
import com.hunghutech.hrm.data.api.ApiClient;
import com.hunghutech.hrm.data.api.AttendanceService;
import com.hunghutech.hrm.data.api.DeviceService;
import com.hunghutech.hrm.data.api.SiteService;
import com.hunghutech.hrm.data.model.AttendanceResponse;
import com.hunghutech.hrm.data.model.CheckRequest;
import com.hunghutech.hrm.data.model.NonceResponse;
import com.hunghutech.hrm.data.model.SiteNearestResponse;
import com.hunghutech.hrm.utils.BiometricHelper;
import com.hunghutech.hrm.utils.DeviceIdHelper;
import com.hunghutech.hrm.utils.LocationHelper;

import java.nio.charset.StandardCharsets;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CheckInActivity extends AppCompatActivity {
    private TextView tvStatus;
    private ProgressBar progress;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_check_in);
        tvStatus = findViewById(R.id.tvStatus);
        progress = findViewById(R.id.progress);
        Button btnNearest = findViewById(R.id.btnNearest);
        Button btnCheckIn = findViewById(R.id.btnCheckIn);
        // Removed Check-Out button from UI

        btnNearest.setOnClickListener(v -> loadNearest());
        btnCheckIn.setOnClickListener(v -> doCheck(true));
        // no-op
    }

    private void loadNearest() {
        if (!LocationHelper.hasLocationPermission(this)) {
            LocationHelper.requestLocationPermission(this);
            return;
        }
        // Chính sách chỉ cho phép khi đang kết nối Wi‑Fi công ty
        if (com.hunghutech.hrm.BuildConfig.RESTRICT_WIFI && !com.hunghutech.hrm.utils.WifiGuard.isOnAllowedWifi(this)) {
            try { com.google.android.material.snackbar.Snackbar.make(tvStatus, "Chỉ chấm công khi kết nối Wi‑Fi công ty", com.google.android.material.snackbar.Snackbar.LENGTH_LONG).show(); } catch (Exception ignored) {}
            tvStatus.setText("Chỉ chấm công khi kết nối Wi‑Fi công ty");
            return;
        }
        progress.setVisibility(View.VISIBLE);
        LocationHelper.getSingleLocation(this, new LocationHelper.Callback() {
            @Override
            public void onSuccess(Location location) {
                SiteService service = ApiClient.get(CheckInActivity.this).create(SiteService.class);
                service.getNearest(location.getLongitude(), location.getLatitude()).enqueue(new Callback<SiteNearestResponse>() {
                    @Override
                    public void onResponse(Call<SiteNearestResponse> call, Response<SiteNearestResponse> response) {
                        progress.setVisibility(View.GONE);
                        if (response.isSuccessful() && response.body() != null) {
                            SiteNearestResponse.Site site = response.body().nearest;
                            if (site != null) {
                                tvStatus.setText("Site gần nhất: " + site.name + " (" + Math.round(site.distance) + "m)" + (site.isInRange ? " - Trong vùng" : " - Ngoài vùng"));
                            } else {
                                tvStatus.setText("Không tìm thấy site gần");
                            }
                        } else {
                            tvStatus.setText("Lỗi tải site gần nhất");
                        }
                    }

                    @Override
                    public void onFailure(Call<SiteNearestResponse> call, Throwable t) {
                        progress.setVisibility(View.GONE);
                        tvStatus.setText("Lỗi: " + t.getMessage());
                    }
                });
            }

            @Override
            public void onError(String message) {
                progress.setVisibility(View.GONE);
                tvStatus.setText(message);
            }
        });
    }

    private void doCheck(boolean isCheckIn) {
        if (!LocationHelper.hasLocationPermission(this)) {
            LocationHelper.requestLocationPermission(this);
            return;
        }
        // Chính sách chỉ cho phép khi đang kết nối Wi‑Fi công ty
        if (com.hunghutech.hrm.BuildConfig.RESTRICT_WIFI && !com.hunghutech.hrm.utils.WifiGuard.isOnAllowedWifi(this)) {
            try { com.google.android.material.snackbar.Snackbar.make(tvStatus, "Chỉ chấm công khi kết nối Wi‑Fi công ty", com.google.android.material.snackbar.Snackbar.LENGTH_LONG).show(); } catch (Exception ignored) {}
            tvStatus.setText("Chỉ chấm công khi kết nối Wi‑Fi công ty");
            return;
        }
        progress.setVisibility(View.VISIBLE);
        LocationHelper.getSingleLocation(this, new LocationHelper.Callback() {
            @Override
            public void onSuccess(Location location) {
                AttendanceService att = ApiClient.get(CheckInActivity.this).create(AttendanceService.class);
                att.getNonce().enqueue(new Callback<NonceResponse>() {
                    @Override
                    public void onResponse(Call<NonceResponse> call, Response<NonceResponse> response) {
                        if (!response.isSuccessful() || response.body() == null) {
                            progress.setVisibility(View.GONE);
                            tvStatus.setText("Không lấy được nonce");
                            return;
                        }
                        String nonce = response.body().nonce;
                        byte[] nonceBytes = nonce.getBytes(StandardCharsets.UTF_8);
                        if (!BiometricHelper.isBiometricAvailable(CheckInActivity.this)) {
                            progress.setVisibility(View.GONE);
                            Toast.makeText(CheckInActivity.this, "Thiết bị không hỗ trợ sinh trắc học", Toast.LENGTH_SHORT).show();
                            return;
                        }
                        BiometricHelper.authenticateAndSign(CheckInActivity.this, isCheckIn ? "Xác thực để chấm công vào" : "Xác thực để chấm công ra", "Vân tay/FaceID", nonceBytes, new BiometricHelper.Callback() {
                            @Override
                            public void onSuccess(String signatureBase64, String publicKeyPem) {
                                // Đăng ký thiết bị nếu cần (1 lần duy nhất)
                                String deviceIdHash = DeviceIdHelper.getDeviceIdHash(CheckInActivity.this);
                                DeviceService dev = ApiClient.get(CheckInActivity.this).create(DeviceService.class);
                                dev.register(new DeviceService.RegisterBody(deviceIdHash, publicKeyPem)).enqueue(new Callback<ResponseBody>() {
                                    @Override
                                    public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                                        // tiếp tục chấm công (kể cả nếu đã đăng ký rồi, backend nên idempotent)
                                        submitAttendance(isCheckIn, deviceIdHash, nonce, signatureBase64, location);
                                    }

                                    @Override
                                    public void onFailure(Call<ResponseBody> call, Throwable t) {
                                        // vẫn thử submit, backend có thể cho qua nếu đã đăng ký từ trước
                                        submitAttendance(isCheckIn, deviceIdHash, nonce, signatureBase64, location);
                                    }
                                });
                            }

                            @Override
                            public void onError(String message) {
                                progress.setVisibility(View.GONE);
                                tvStatus.setText("Xác thực thất bại: " + message);
                            }
                        });
                    }

                    @Override
                    public void onFailure(Call<NonceResponse> call, Throwable t) {
                        progress.setVisibility(View.GONE);
                        tvStatus.setText("Lỗi nonce: " + t.getMessage());
                    }
                });
            }

            @Override
            public void onError(String message) {
                progress.setVisibility(View.GONE);
                tvStatus.setText(message);
            }
        });
    }

    private void submitAttendance(boolean isCheckIn, String deviceIdHash, String nonce, String signatureB64, Location location) {
        AttendanceService att = ApiClient.get(this).create(AttendanceService.class);
        CheckRequest body = new CheckRequest(
                deviceIdHash,
                nonce,
                signatureB64,
                location.getLatitude(),
                location.getLongitude(),
                location.hasAccuracy() ? location.getAccuracy() : 0
        );
        Call<AttendanceResponse> call = isCheckIn ? att.checkIn(body) : att.checkOut(body);
        call.enqueue(new Callback<AttendanceResponse>() {
            @Override
            public void onResponse(Call<AttendanceResponse> call, Response<AttendanceResponse> response) {
                progress.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    AttendanceResponse ar = response.body();
                    String msg = (isCheckIn ? "Đã chấm công vào" : "Đã chấm công ra") +
                            " | Khoảng cách: " + Math.round(ar.distance) + "m" +
                            (ar.flags != null && ar.flags.lateOver30 ? " | Trễ > 30'" : "");
                    tvStatus.setText(msg);
                    try { com.google.android.material.snackbar.Snackbar.make(tvStatus, msg, com.google.android.material.snackbar.Snackbar.LENGTH_LONG).show(); } catch (Exception ignored) {}
                } else {
                    // Hiển thị nội dung lỗi chi tiết từ server
                    try {
                        String err = response.errorBody() != null ? response.errorBody().string() : null;
                        if (err != null && err.startsWith("{")) {
                            org.json.JSONObject o = new org.json.JSONObject(err);
                            String m = o.optString("msg", "Từ chối chấm công");
                            String type = o.optString("type", "");
                            Double dist = o.has("distance") ? o.optDouble("distance") : null;
                            Integer req = o.has("requiredDistance") ? o.optInt("requiredDistance") : null;
                            String more = (dist != null ? (" | Cách: " + Math.round(dist) + "m") : "") + (req != null ? (" | Yêu cầu ≤ " + req + "m") : "");
                            String out = m + more;
                            tvStatus.setText(out);
                            try { com.google.android.material.snackbar.Snackbar.make(tvStatus, out, com.google.android.material.snackbar.Snackbar.LENGTH_LONG).show(); } catch (Exception ignored) {}
                        } else {
                            tvStatus.setText("Từ chối chấm công");
                            try { com.google.android.material.snackbar.Snackbar.make(tvStatus, "Từ chối chấm công", com.google.android.material.snackbar.Snackbar.LENGTH_LONG).show(); } catch (Exception ignored) {}
                        }
                    } catch (Exception e) {
                        tvStatus.setText("Từ chối chấm công");
                        try { com.google.android.material.snackbar.Snackbar.make(tvStatus, "Từ chối chấm công", com.google.android.material.snackbar.Snackbar.LENGTH_LONG).show(); } catch (Exception ignored) {}
                    }
                }
            }

            @Override
            public void onFailure(Call<AttendanceResponse> call, Throwable t) {
                progress.setVisibility(View.GONE);
                tvStatus.setText("Lỗi chấm công: " + t.getMessage());
            }
        });
    }
}
