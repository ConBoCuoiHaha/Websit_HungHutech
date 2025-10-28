// User & Auth Types
// Types updated on 2025-10-16
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  nhan_vien_id?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Nhân Viên Types
export interface NhanVien {
  _id: string;
  ma_nhan_vien: string;
  ho_dem: string;
  ten: string;
  biet_danh?: string;
  ngay_sinh?: string;
  gioi_tinh?: 'Nam' | 'Nữ' | 'Khác';
  tinh_trang_hon_nhan?: string;
  lien_he?: {
    email_cong_viec?: string;
    di_dong?: string;
    dien_thoai_nha?: string;
  };
  thong_tin_cong_viec?: {
    ngay_vao_lam?: string;
    chuc_danh_id?: ChucDanh;
    phong_ban_id?: PhongBan;
    trang_thai_lao_dong_id?: TrangThaiLaoDong;
  };
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

// Chức Danh Types
export interface ChucDanh {
  _id: string;
  ten_chuc_danh: string;
  mo_ta?: string;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

// Phòng Ban Types
export interface PhongBan {
  _id: string;
  ten: string;
  mo_ta?: string;
  quan_ly_id?: NhanVien;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

// Địa Điểm Types
export interface DiaDiem {
  _id: string;
  ten: string;
  thanh_pho?: string;
  quoc_gia?: string;
  dia_chi?: string;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

// Trạng Thái Lao Động Types
export interface TrangThaiLaoDong {
  _id: string;
  ten: string;
  mo_ta?: string;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

// Bậc Lương Types
export interface BacLuong {
  _id: string;
  ten_bac_luong: string;
  muc_luong_toi_thieu?: number | { $numberDecimal: string };
  muc_luong_toi_da?: number | { $numberDecimal: string };
  don_vi_tien_te?: 'VND' | 'USD';
  ghi_chu?: string;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

// Dashboard Types
export interface DashboardSummary {
  employees: number;
  leavePending: number;
  claimsPending: number;
  departments: number;
  attendanceToday: number;
  leaveToday: number;
  attendanceTrend?: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
  }>;
  leaveTypesDistribution?: Array<{
    name: string;
    value: number;
  }>;
  departmentStats?: Array<{
    name: string;
    total: number;
    present: number;
  }>;
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  q?: string;
  sort?: string;
}

// Leave Management Types
export interface LoaiNgayNghi {
  _id: string;
  ten: string;
  mo_ta?: string;
  da_xoa?: boolean;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface QuyenNghiPhep {
  _id: string;
  nhan_vien_id: string | NhanVien;
  loai_ngay_nghi_id: string | LoaiNgayNghi;
  so_ngay_duoc_huong: number;
  so_ngay_da_su_dung: number;
  nam: number;
  ghi_chu?: string;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface YeuCauNghiPhep {
  _id: string;
  nhan_vien_id: string | NhanVien;
  loai_ngay_nghi_id: string | LoaiNgayNghi;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  so_ngay: number;
  ly_do?: string;
  trang_thai: 'Cho duyet' | 'Da duyet' | 'Bi tu choi' | 'Da huy';
  nguoi_duyet_id?: string | NhanVien;
  ghi_chu_quan_ly?: string;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface LeaveBalance {
  loai_ngay_nghi: LoaiNgayNghi;
  so_ngay_duoc_huong: number;
  so_ngay_da_su_dung: number;
  so_ngay_con_lai: number;
}

// Attendance (Chấm công) Types
export interface ChamCong {
  _id: string;
  nhan_vien_id: string | NhanVien;
  thoi_gian_vao: string;
  thoi_gian_ra?: string;
  ngay: string;
  ghi_chu?: string;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  total_hours: number;
}

// Claims (Bồi hoàn) Types
export interface ClaimItem {
  ngay: string;
  so_tien: number;
  mo_ta?: string;
  danh_muc?: string;
}

export interface Claim {
  _id: string;
  nhan_vien_id: string | NhanVien;
  trang_thai: 'Submitted' | 'Approved' | 'Rejected' | 'Paid';
  tong_tien: number;
  items: ClaimItem[];
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

// Recruitment (Tuyển dụng) Types
export interface Vacancy {
  _id: string;
  tieu_de: string;
  mo_ta?: string;
  hiring_manager_id: string | NhanVien;
  trang_thai: 'Mo' | 'Dong';
  dia_diem_id?: string | DiaDiem;
  da_xoa?: boolean;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface Candidate {
  _id: string;
  ho_ten: string;
  email: string;
  dien_thoai?: string;
  ghi_chu?: string;
  da_xoa?: boolean;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface Application {
  _id: string;
  vacancy_id: string | Vacancy;
  candidate_id: string | Candidate;
  trang_thai: 'Ung tuyen' | 'So tuyen' | 'Phong van' | 'Tuyen dung' | 'Tu choi';
  ghi_chu?: string;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

// Interview (Phỏng vấn) Types
export interface InterviewerInfo {
  nhan_vien_id: string | NhanVien;
  vai_tro?: string;
}

export interface InterviewerOpinion {
  nhan_vien_id: string | NhanVien;
  y_kien?: string;
  diem?: number;
}

export interface InterviewResult {
  danh_gia_tong_quan?: string;
  diem_so?: number;
  diem_manh?: string[];
  diem_yeu?: string[];
  quyet_dinh?: 'Đậu' | 'Trượt' | 'Chưa quyết định';
  y_kien_nguoi_phong_van?: InterviewerOpinion[];
}

export interface Interview {
  _id: string;
  ung_vien_id: string | Candidate;
  vi_tri_tuyen_dung_id: string | Vacancy;
  loai_phong_van: 'Sơ tuyển' | 'Phỏng vấn chuyên môn' | 'Phỏng vấn quản lý' | 'Phỏng vấn cuối cùng';
  ngay_gio: string;
  dia_diem?: string;
  hinh_thuc?: 'Trực tiếp' | 'Trực tuyến' | 'Điện thoại';
  nguoi_phong_van?: InterviewerInfo[];
  trang_thai: 'Đã lên lịch' | 'Đang chờ xác nhận' | 'Đã xác nhận' | 'Đã hoàn thành' | 'Đã hủy' | 'Ứng viên vắng mặt';
  link_phong_van?: string;
  ghi_chu?: string;
  ket_qua_phong_van?: InterviewResult;
  da_xoa?: boolean;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface InterviewSchedule {
  items: Interview[];
  total: number;
}

// Performance (Hiệu suất) Types
export interface KPI {
  _id: string;
  ten: string;
  mo_ta?: string;
  trong_so: number;
  kich_hoat: boolean;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface Rating {
  kpi_id: string | KPI;
  diem: number;
  ghi_chu?: string;
}

export interface PerformanceReview {
  _id: string;
  nhan_vien_id: string | NhanVien;
  nguoi_danh_gia_id: string | NhanVien;
  tu_ngay: string;
  den_ngay: string;
  trang_thai: 'Draft' | 'InReview' | 'Completed';
  ratings: Rating[];
  diem_tong: number;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

// Holiday Management Types
export interface NgayLe {
  _id: string;
  ten_ngay_le: string;
  ngay: string;
  lap_lai_hang_nam: boolean;
  mo_ta?: string;
  khu_vuc: 'Toàn quốc' | 'Miền Bắc' | 'Miền Nam' | 'Miền Trung';
  trang_thai: 'Kích hoạt' | 'Không kích hoạt';
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

// Time Management (Timesheet) Types
export interface Project {
  _id: string;
  ten: string; // Project name
  khach_hang?: string; // Customer name
  mo_ta?: string; // Description
  trang_thai?: 'Hoạt động' | 'Tạm dừng' | 'Hoàn thành'; // Status
  kich_hoat?: boolean;
  da_xoa?: boolean;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface Activity {
  _id: string;
  project_id: string | Project;
  ten: string; // Changed from ten_hoat_dong to match backend model
  kich_hoat?: boolean;
  da_xoa?: boolean;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface TimesheetEntry {
  ngay: string;
  project_id: string | Project;
  activity_id: string | Activity;
  gio: number;
  ghi_chu?: string;
}

export interface Timesheet {
  _id: string;
  nhan_vien_id: string | NhanVien;
  tuan_bat_dau: string;
  trang_thai: 'Cho duyet' | 'Da duyet' | 'Bi tu choi';
  entries: TimesheetEntry[];
  nguoi_duyet_id?: string | NhanVien;
  ghi_chu_quan_ly?: string;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

// Report Types
export interface ReportCriteria {
  truong: string;
  dieu_kien: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'BETWEEN';
  gia_tri: any;
}

export interface ReportSort {
  truong: string;
  thu_tu: 'asc' | 'desc';
}

export interface Report {
  _id: string;
  ten_bao_cao: string;
  loai_bao_cao: 'Nhan vien' | 'Cham cong' | 'Nghi phep' | 'Boi hoan' | 'Luong' | 'Hieu suat';
  tieu_chi: ReportCriteria[];
  cot_hien_thi: string[];
  sap_xep?: ReportSort;
  nguoi_tao_id?: string | User;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface GenerateReportRequest {
  loai_bao_cao: 'Nhan vien' | 'Cham cong' | 'Nghi phep' | 'Boi hoan' | 'Luong' | 'Hieu suat';
  tieu_chi?: ReportCriteria[];
  cot_hien_thi?: string[];
  sap_xep?: ReportSort;
  page?: number;
  limit?: number;
}

export interface GenerateReportResponse {
  items: any[];
  page: number;
  limit: number;
  total: number;
  loai_bao_cao: string;
}

// API Error Types
export interface ApiError {
  msg: string;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  type?: string;
}

// Admin Configuration Types
export interface EmploymentStatus {
  _id: string;
  ten_trang_thai: string;
  mo_ta?: string;
  kich_hoat: boolean;
  thu_tu_sap_xep?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobCategory {
  _id: string;
  ten_danh_muc: string;
  mo_ta?: string;
  kich_hoat: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Nationality {
  _id: string;
  ten_quoc_tich: string;
  ma_quoc_gia?: string;
  kich_hoat: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Skill {
  _id: string;
  ten_ky_nang: string;
  mo_ta?: string;
  loai_ky_nang: 'Kỹ thuật' | 'Quản lý' | 'Giao tiếp' | 'Ngoại ngữ' | 'Khác';
  kich_hoat: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EducationLevel {
  _id: string;
  ten_trinh_do: string;
  mo_ta?: string;
  cap_do?: number;
  kich_hoat: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Language {
  _id: string;
  ten_ngon_ngu: string;
  ma_ngon_ngu?: string;
  kich_hoat: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Performance Tracker Types
export interface PerformanceGoal {
  _id?: string;
  ten_muc_tieu: string;
  mo_ta?: string;
  trong_so?: number;
  trang_thai: 'Chưa bắt đầu' | 'Đang thực hiện' | 'Hoàn thành' | 'Quá hạn' | 'Đã hủy';
  tien_do?: number;
  diem_danh_gia?: number;
  nhan_xet?: string;
  ngay_bat_dau?: string;
  ngay_hoan_thanh?: string;
  han_hoan_thanh?: string;
}

export interface PerformanceOverallReview {
  diem_tong?: number;
  xep_loai?: 'Xuất sắc' | 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu';
  nhan_xet?: string;
  diem_manh?: string[];
  diem_yeu?: string[];
  ke_hoach_phat_trien?: string;
}

export interface PerformanceTracker {
  _id: string;
  ten_tracker: string;
  nhan_vien_id: string | NhanVien;
  nguoi_danh_gia_id: string | NhanVien;
  ky_danh_gia: {
    tu_ngay: string;
    den_ngay: string;
  };
  muc_tieu: PerformanceGoal[];
  danh_gia_chung?: PerformanceOverallReview;
  trang_thai: 'Nháp' | 'Đang theo dõi' | 'Đã hoàn thành' | 'Đã hủy';
  ghi_chu?: string;
  diem_trung_binh?: number;
  tien_do_tong?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PerformanceTrackerStatistics {
  tong_tracker: number;
  dang_theo_doi: number;
  da_hoan_thanh: number;
  diem_trung_binh: number | null;
}

// Maintenance & GDPR Compliance Types
export interface RelatedDataCount {
  total: number;
  leave_requests?: number;
  attendance?: number;
  timesheets?: number;
  performance_trackers?: number;
  performance_reviews?: number;
  claims?: number;
  posts?: number;
  applications?: number;
  interviews?: number;
}

export interface PurgeableEmployee extends NhanVien {
  related_data_count: RelatedDataCount;
  retention_period: string;
  days_since_deletion: number;
  reason: string;
  can_purge: boolean;
}

export interface PurgeableCandidate extends Candidate {
  last_status: string;
  related_data_count: RelatedDataCount;
  retention_period: string;
  days_since_update: number;
  reason: string;
  can_purge: boolean;
}

export interface PurgeLog {
  _id: string;
  loai: 'NhanVien' | 'UngVien';
  doi_tuong_id: string;
  ten_doi_tuong: string;
  nguoi_thuc_hien_id: string | User;
  ngay_thuc_hien: string;
  ly_do: string;
  du_lieu_lien_quan: {
    ma_nhan_vien?: string;
    ho_ten?: string;
    email?: string;
    dien_thoai?: string;
    deleted_records?: {
      [key: string]: number;
    };
  };
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface PurgeableResponse<T> {
  items: T[];
  total: number;
  retention_policy_days: number;
}

export interface PurgeLogsResponse {
  items: PurgeLog[];
  page: number;
  limit: number;
  total: number;
}
