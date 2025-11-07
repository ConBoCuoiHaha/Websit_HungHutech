# HungHutech HRM – Mobile App (Android, Java)

Mục tiêu: mô tả đầy đủ kiến trúc, tính năng, bảo mật, API, cấu trúc mã nguồn, quy trình build/QA và checklist bàn giao cho ứng dụng chấm công di động (Android, Java) để người khác có thể tiếp tục thực hiện khi cần.

---

**Phạm Vi**
- Nền tảng: Android (Java, AndroidX)
- Người dùng: Nhân viên, Quản lý (vai trò trên JWT: `employee`, `manager`)
- Tính năng lõi: Đăng nhập, chấm công bằng sinh trắc học + GPS (geofence), xem lịch sử, hồ sơ cá nhân; quản lý có thể xem/duyệt nghỉ (tối thiểu xem – tạo/duyệt có thể bổ sung V2)
- Không kết nối trực tiếp MongoDB Atlas từ App. App chỉ gọi REST API (backend Node/Express hiện có) – backend đọc/ghi Atlas.

---

**Tổng Quan Kiến Trúc**
- Mobile App (Android Java)
  - BiometricPrompt để “mở khoá hành động” (không lưu hay gửi dữ liệu vân tay)
  - GPS (Fused Location) để lấy toạ độ và độ chính xác (accuracy)
  - Retrofit2 + OkHttp để gọi REST API (HTTPS)
  - SharedPreferences/EncryptedSharedPreferences để lưu token + device binding
- Backend BFF (Node.js/Express – đã có trong repo)
  - Xác thực JWT + RBAC
  - API sites (địa điểm chấm công), mobile/sites/nearest (đã có)
  - Bổ sung API mobile cho attendance + device binding + nonce (mục “Hợp Đồng API”)
  - Kết nối MongoDB Atlas (dùng chung với Website)
- Website Admin (Vue – đã có)
  - Quản lý nhân sự, báo cáo, cấu hình Sites/ca/ngày nghỉ
  - Nội bộ (localhost), vẫn đọc/ghi Atlas → nhìn thấy dữ liệu app ngay
- MongoDB Atlas
  - Cluster chung cho Website + Backend API + App

---

**Nguyên Tắc Bảo Mật**
- Không lưu mẫu/ảnh/hash vân tay trên Atlas. Android không cho truy xuất; chỉ dùng BiometricPrompt để xác thực cục bộ.
- JWT + RBAC trên mọi request (header: `Authorization: Bearer <token>`) – token lấy từ `POST /api/auth/login`.
- Device binding (1 thiết bị/người dùng): app đăng ký `deviceIdHash` + `publicKey`. Mỗi lần chấm công, ký `nonce` do server cấp bằng private key trong Android Keystore.
- Anti‑replay: server cấp `nonce` TTL 1–2 phút, kiểm tra chữ ký hợp lệ.
- Geofence: server tính khoảng cách (Haversine/GeoNear) đến `site.radius`; chỉ chấm công nếu `distance <= radius` và `accuracy` chấp nhận (ví dụ ≤ 50 m).
- Anti‑mock: client gắn cờ `isFromMockProvider`; server ghi log/flag, có thể chặn khi nghi ngờ. Tùy chọn: Play Integrity API (bản cơ bản – miễn phí) để hạn chế máy root/emulator.
- Rate limiting trên backend, audit logs cho hành động nhạy cảm.

---

**Hợp Đồng API (dự kiến/đang có)**
- Xác thực
  - POST `/api/auth/login` → { token, user }
  - (Tuỳ chọn) POST `/api/auth/forgot-password` và OTP cho reset. Không dùng OTP mặc định cố định.
- Sites (đã có)
  - GET `/api/mobile/sites/active` → các site đang hoạt động
  - GET `/api/mobile/sites/nearest?longitude=..&latitude=..` → site gần nhất, kèm `distance`, `isInRange`
- Device binding (cần bổ sung)
  - POST `/api/mobile/devices/register`
    - Body: { deviceIdHash, publicKey } → 200 { success: true }
- Attendance (cần bổ sung)
  - GET `/api/mobile/attendance/nonce` → { nonce, expiresAt }
  - POST `/api/mobile/attendance/check-in`
    - Headers: `Authorization: Bearer <token>`
    - Body: { deviceIdHash, nonce, signature, lat, lng, accuracy }
    - 200 { attendance: {...}, flags: { isLate, lateOver30, isMock }, distance }
  - POST `/api/mobile/attendance/check-out` – tương tự body/checks như check-in
  - GET `/api/mobile/attendance/today` → trạng thái hôm nay
  - GET `/api/mobile/attendance/history?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Shifts (cần bổ sung)
  - GET `/api/mobile/shifts/today` → shift hiện tại/tiếp theo của employee
- Leaves (đã có nền tảng trên web, bổ sung endpoint thu gọn cho mobile)
  - GET `/api/mobile/leaves/my` → nghỉ phép của bản thân (trong khoảng thời gian)

Chuẩn lỗi API
- 401: token không hợp lệ/hết hạn
- 403: không đủ quyền
- 400: dữ liệu không hợp lệ / ngoài geofence / accuracy quá lớn / nonce hết hạn
- 409: thiết bị chưa đăng ký hoặc bị vô hiệu hóa
- 5xx: lỗi máy chủ
- Body lỗi: `{ msg: string, type?: string, field?: string, ... }`

---

**Quy Tắc Nghiệp Vụ**
- Đi muộn
  - ≤ 5 phút: on‑time (grace)
  - > 5 đến ≤ 30 phút: late (ghi `lateMinutes`)
  - > 30 phút: lateOver30 (vẫn ghi log, gắn cờ – không bỏ bản ghi)
- Nghỉ phép
  - Ngày/buổi nghỉ đã duyệt → server từ chối check‑in (app hiển thị thông báo “Bạn được nghỉ”)
- Thiết bị
  - Mỗi nhân viên 1 thiết bị. Khi đổi/hỏng máy: quản lý/admin xoá binding cũ → đăng ký lại.
- Admin/Quản lý chấm thay (web)
  - Cho phép “manual override” trên website; bắt buộc lý do, audit log và flag `manualOverride`.

---

**Cấu Trúc Dự Án Android (đề xuất)**
```
com.hunghutech.hrm/
  data/
    api/
      ApiClient.java            // Retrofit + OkHttp
      AuthService.java          // /auth
      SiteService.java          // /mobile/sites
      AttendanceService.java    // /mobile/attendance
      DeviceService.java        // /mobile/devices
      LeaveService.java         // /mobile/leaves
    model/
      User.java, Site.java, AttendanceRecord.java, AttendanceDaily.java,
      Shift.java, ShiftAssignment.java, LeaveRequest.java
    repository/
      AuthRepository.java, AttendanceRepository.java, SiteRepository.java, ...
  ui/
    auth/ LoginActivity.java, ForgotPasswordActivity.java
    attendance/ CheckInActivity.java, HistoryActivity.java
    profile/ ProfileActivity.java
    home/ HomeActivity.java
  utils/
    BiometricHelper.java       // BiometricPrompt + Keystore CryptoObject
    LocationHelper.java        // FusedLocation + accuracy checks
    DeviceIdHelper.java        // tạo deviceIdHash (ANDROID_ID + salt)
    NonceManager.java
    TokenStore.java            // EncryptedSharedPreferences cho JWT
  App.java                     // Application class
```

---

**Phụ Thuộc (Gradle)**
- Retrofit2 + OkHttp3 + Gson
- AndroidX Biometric (v1.2+)
- Play Services Location (Fused Location)
- Material Components / AppCompat
- (Tuỳ chọn) Room + WorkManager (offline queue – V2)

---

**Quyền & Cấu Hình**
- AndroidManifest
  - `INTERNET`, `ACCESS_NETWORK_STATE`
  - `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
  - `USE_BIOMETRIC` (hoặc `USE_FINGERPRINT` cho API cũ)
- Base URL
  - Sử dụng `BuildConfig.BASE_URL` (buildConfigField theo build type) – ví dụ dev: `http://10.0.2.2:5000/api`

---

**Luồng Chính (Pseudo)**
- Đăng nhập
  - Gọi `POST /api/auth/login` → lưu `token` vào `TokenStore`
  - Nếu chưa đăng ký thiết bị: tạo cặp khoá Keystore, gửi `deviceIdHash` + `publicKey` lên `/mobile/devices/register`
- Check‑in/Check‑out
  1. Yêu cầu vị trí → lấy `lat`, `lng`, `accuracy`; chặn nếu `accuracy > 50m`
  2. Lấy `nonce` từ `/mobile/attendance/nonce`
  3. Hiển thị BiometricPrompt → ký `nonce` bằng private key (CryptoObject)
  4. Gọi `/mobile/attendance/check-in|check-out` kèm `{ deviceIdHash, nonce, signature, lat, lng, accuracy }`
  5. Server trả về `{ distance, flags, attendance }` → hiển thị trạng thái
- Nearest site
  - Gọi `/mobile/sites/nearest?longitude=..&latitude=..` để hiển thị site gần nhất + khả năng chấm công
- Lịch sử
  - Gọi `/mobile/attendance/history` (filter by from/to)

---

**Ví Dụ Interface Retrofit (rút gọn)**
```java
public interface AttendanceService {
  @GET("/mobile/attendance/nonce")
  Call<NonceResponse> getNonce();

  @POST("/mobile/attendance/check-in")
  Call<AttendanceResponse> checkIn(@Body CheckRequest body);

  @POST("/mobile/attendance/check-out")
  Call<AttendanceResponse> checkOut(@Body CheckRequest body);
}
```

---

**Xử Lý Lỗi & UX Trạng Thái**
- 401: xoá token, chuyển Login
- 400 (ngoài vùng/accuracy cao/nonce hết hạn): hiển thị thông báo + hướng dẫn (bật GPS, đứng gần hơn)
- 409 (thiết bị chưa đăng ký/bị thu hồi): yêu cầu đăng ký lại
- Hiển thị spinner khi lấy vị trí/khi đang chấm
- Ghi log client (Timber/Logcat) – không in token

---

**Kiểm Thử & QA**
- Unit tests: helpers (distance, parse, validator)
- API integration: Retrofit + MockWebServer (tuỳ chọn)
- UI tests cơ bản: luồng Login → Check‑in thành công/ngoài vùng
- Thử nghiệm thực tế: trong site radius (100–200m), accuracy tốt, mock off

---

**Build & Phát Hành**
- Yêu cầu: Android Studio Jellyfish+, JDK 11+
- Build dev: cấu hình `BASE_URL` trỏ `http://<LAN-IP>:5000/api`
- Ký ứng dụng: keystore riêng (không commit)
- Phát hành nội bộ: file APK/AAB (internal testing)

---

**Bàn Giao – Checklist**
- Mã nguồn Android theo cấu trúc trên, có hướng dẫn build
- File `.env`/cấu hình base URL (không chứa bí mật sản xuất)
- Danh sách endpoint đã áp dụng và trạng thái (đã có/đang đợi backend)
- Tài khoản test (employee, manager) – email/password (không OTP cố định)
- Ghi chú chính sách: 1 thiết bị/người dùng, geofence, late rule
- Liên kết tài liệu: PLANS.md, API docs (Swagger `/api/docs`), Postman collection

---

**Lộ Trình V1**
1) Backend: bổ sung `/mobile/devices/*`, `/mobile/attendance/*`, `/mobile/shifts/today`, `/mobile/leaves/my`
2) App: Login → Device register → Nearest site → Check‑in/out → History → Profile → Logout
3) QA: Kiểm thử geofence/accuracy/nonce/biometric, log audit

---

**Ghi Chú Quan Trọng**
- App không kết nối trực tiếp Atlas; mọi giao tiếp qua REST API backend
- Không lưu hay truyền dữ liệu vân tay; chỉ sử dụng BiometricPrompt để xác thực cục bộ và ký nonce
- Không dùng OTP mặc định cố định; nếu dùng cho reset, phải sinh động + TTL + hash + rate‑limit

