const { body, param, query } = require('express-validator');

// Common validators
const idValidator = () => param('id').isMongoId().withMessage('ID không hợp lệ');

const paginationValidators = () => [
  query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
  query('q').optional().isString().withMessage('Từ khóa tìm kiếm phải là chuỗi'),
  query('sort').optional().isString().withMessage('Sắp xếp phải là chuỗi'),
];

// Nhân viên validators
const nhanVienValidators = {
  create: [
    body('ma_nhan_vien').notEmpty().withMessage('Mã nhân viên không được trống'),
    body('ho_dem').notEmpty().withMessage('Họ đệm không được trống'),
    body('ten').notEmpty().withMessage('Tên không được trống'),
    body('ngay_sinh').optional().isISO8601().withMessage('Ngày sinh không hợp lệ'),
    body('gioi_tinh').optional().isIn(['Nam', 'Nữ', 'Khác']).withMessage('Giới tính không hợp lệ'),
    body('lien_he.email_cong_viec').optional().isEmail().withMessage('Email công việc không hợp lệ'),
    body('lien_he.di_dong').optional().isMobilePhone().withMessage('Số điện thoại không hợp lệ'),
    body('thong_tin_cong_viec.ngay_vao_lam').optional().isISO8601().withMessage('Ngày vào làm không hợp lệ'),
  ],
  update: [
    idValidator(),
    body('ma_nhan_vien').optional().notEmpty().withMessage('Mã nhân viên không được trống'),
    body('ho_dem').optional().notEmpty().withMessage('Họ đệm không được trống'),
    body('ten').optional().notEmpty().withMessage('Tên không được trống'),
    body('ngay_sinh').optional().isISO8601().withMessage('Ngày sinh không hợp lệ'),
    body('gioi_tinh').optional().isIn(['Nam', 'Nữ', 'Khác']).withMessage('Giới tính không hợp lệ'),
    body('lien_he.email_cong_viec').optional().isEmail().withMessage('Email công việc không hợp lệ'),
  ],
};

// Chức danh validators
const chucDanhValidators = {
  create: [
    body('ten_chuc_danh').notEmpty().withMessage('Tên chức danh không được trống'),
    body('mo_ta').optional().isString().withMessage('Mô tả phải là chuỗi'),
  ],
  update: [
    idValidator(),
    body('ten_chuc_danh').optional().notEmpty().withMessage('Tên chức danh không được trống'),
    body('mo_ta').optional().isString().withMessage('Mô tả phải là chuỗi'),
  ],
};

// Phòng ban validators
const phongBanValidators = {
  create: [
    body('ten').notEmpty().withMessage('Tên phòng ban không được trống'),
    body('mo_ta').optional().isString().withMessage('Mô tả phải là chuỗi'),
    body('quan_ly_id').optional().isMongoId().withMessage('ID quản lý không hợp lệ'),
  ],
  update: [
    idValidator(),
    body('ten').optional().notEmpty().withMessage('Tên phòng ban không được trống'),
    body('mo_ta').optional().isString().withMessage('Mô tả phải là chuỗi'),
    body('quan_ly_id').optional().isMongoId().withMessage('ID quản lý không hợp lệ'),
  ],
};

// Địa điểm validators
const diaDiemValidators = {
  create: [
    body('ten').notEmpty().withMessage('Tên địa điểm không được trống'),
    body('thanh_pho').optional().isString().withMessage('Thành phố phải là chuỗi'),
    body('quoc_gia').optional().isString().withMessage('Quốc gia phải là chuỗi'),
  ],
  update: [
    idValidator(),
    body('ten').optional().notEmpty().withMessage('Tên địa điểm không được trống'),
  ],
};

// Nghỉ phép validators
const nghiPhepValidators = {
  create: [
    body('nhan_vien_id').isMongoId().withMessage('ID nhân viên không hợp lệ'),
    body('loai_ngay_nghi_id').isMongoId().withMessage('ID loại ngày nghỉ không hợp lệ'),
    body('ngay_bat_dau').isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    body('ngay_ket_thuc').isISO8601().withMessage('Ngày kết thúc không hợp lệ'),
    body('so_ngay').isFloat({ min: 0.5 }).withMessage('Số ngày phải lớn hơn hoặc bằng 0.5'),
    body('ly_do').optional().isString().withMessage('Lý do phải là chuỗi'),
  ],
  updateStatus: [
    idValidator(),
    body('trang_thai').isIn(['Cho duyet', 'Da duyet', 'Tu choi', 'Huy']).withMessage('Trạng thái không hợp lệ'),
    body('ghi_chu_duyet').optional().isString().withMessage('Ghi chú phải là chuỗi'),
  ],
};

// Chấm công validators
const chamCongValidators = {
  create: [
    body('nhan_vien_id').isMongoId().withMessage('ID nhân viên không hợp lệ'),
    body('ngay').isISO8601().withMessage('Ngày không hợp lệ'),
    body('gio_vao').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Giờ vào không hợp lệ (HH:MM)'),
    body('gio_ra').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Giờ ra không hợp lệ (HH:MM)'),
    body('tong_gio_lam').optional().isFloat({ min: 0 }).withMessage('Tổng giờ làm phải là số dương'),
  ],
};

// Project validators
const projectValidators = {
  create: [
    body('ten_du_an').notEmpty().withMessage('Tên dự án không được trống'),
    body('ma_du_an').optional().isString().withMessage('Mã dự án phải là chuỗi'),
    body('khach_hang').optional().isString().withMessage('Khách hàng phải là chuỗi'),
    body('ngay_bat_dau').optional().isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    body('ngay_ket_thuc').optional().isISO8601().withMessage('Ngày kết thúc không hợp lệ'),
  ],
  update: [
    idValidator(),
    body('ten_du_an').optional().notEmpty().withMessage('Tên dự án không được trống'),
  ],
};

// Tuyển dụng validators
const vacancyValidators = {
  create: [
    body('ten_vi_tri').notEmpty().withMessage('Tên vị trí không được trống'),
    body('so_luong').isInt({ min: 1 }).withMessage('Số lượng phải là số nguyên dương'),
    body('mo_ta').optional().isString().withMessage('Mô tả phải là chuỗi'),
    body('yeu_cau').optional().isString().withMessage('Yêu cầu phải là chuỗi'),
    body('trang_thai').optional().isIn(['Open', 'Closed']).withMessage('Trạng thái không hợp lệ'),
  ],
};

const candidateValidators = {
  create: [
    body('ho_ten').notEmpty().withMessage('Họ tên không được trống'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('dien_thoai').optional().isMobilePhone().withMessage('Số điện thoại không hợp lệ'),
    body('ngay_ung_tuyen').optional().isISO8601().withMessage('Ngày ứng tuyển không hợp lệ'),
  ],
};

// KPI validators
const kpiValidators = {
  create: [
    body('nhan_vien_id').isMongoId().withMessage('ID nhân viên không hợp lệ'),
    body('ten_kpi').notEmpty().withMessage('Tên KPI không được trống'),
    body('mo_ta').optional().isString().withMessage('Mô tả phải là chuỗi'),
    body('muc_tieu').isFloat({ min: 0 }).withMessage('Mục tiêu phải là số dương'),
    body('ket_qua_thuc_te').optional().isFloat({ min: 0 }).withMessage('Kết quả thực tế phải là số dương'),
    body('thoi_gian_bat_dau').optional().isISO8601().withMessage('Thời gian bắt đầu không hợp lệ'),
    body('thoi_gian_ket_thuc').optional().isISO8601().withMessage('Thời gian kết thúc không hợp lệ'),
  ],
};

// Claims validators
const claimValidators = {
  create: [
    body('nhan_vien_id').isMongoId().withMessage('ID nhân viên không hợp lệ'),
    body('loai_chi_phi').notEmpty().withMessage('Loại chi phí không được trống'),
    body('so_tien').isFloat({ min: 0 }).withMessage('Số tiền phải là số dương'),
    body('ngay_chi_phi').isISO8601().withMessage('Ngày chi phí không hợp lệ'),
    body('mo_ta').optional().isString().withMessage('Mô tả phải là chuỗi'),
  ],
  updateStatus: [
    idValidator(),
    body('trang_thai').isIn(['Submitted', 'Approved', 'Rejected', 'Paid']).withMessage('Trạng thái không hợp lệ'),
  ],
};

// Buzz validators
const buzzValidators = {
  create: [
    body('noi_dung').notEmpty().withMessage('Nội dung không được trống'),
    body('hinh_anh_file_ids').optional().isArray().withMessage('Hình ảnh phải là mảng'),
  ],
  comment: [
    idValidator(),
    body('noi_dung').notEmpty().withMessage('Nội dung bình luận không được trống'),
  ],
};

module.exports = {
  idValidator,
  paginationValidators,
  nhanVienValidators,
  chucDanhValidators,
  phongBanValidators,
  diaDiemValidators,
  nghiPhepValidators,
  chamCongValidators,
  projectValidators,
  vacancyValidators,
  candidateValidators,
  kpiValidators,
  claimValidators,
  buzzValidators,
};
