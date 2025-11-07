const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { allowRoles } = require('../utils/authHandler');
const {
  getAll,
  getById,
  create,
  update,
  delete: deleteInterview,
  updateResult,
  confirm,
  cancel,
  getSchedule,
} = require('../controllers/interview.controller');

// GET /api/recruitment/interviews/schedule - Lấy lịch phỏng vấn theo ngày/tuần
router.get(
  '/schedule',
  [
    query('nguoi_phong_van_id').optional().isMongoId().withMessage('ID người phỏng vấn không hợp lệ'),
    query('tu_ngay').optional().isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    query('den_ngay').optional().isISO8601().withMessage('Ngày kết thúc không hợp lệ'),
    query('view').optional().isIn(['week', 'month', 'day']).withMessage('View không hợp lệ'),
  ],
  handleValidation,
  getSchedule
);

// GET /api/recruitment/interviews - Lấy danh sách lịch phỏng vấn
router.get(
  '/',
  [
    query('q').optional().isString(),
    query('ung_vien_id').optional().isMongoId(),
    query('vi_tri_tuyen_dung_id').optional().isMongoId(),
    query('trang_thai').optional().isString(),
    query('loai_phong_van').optional().isString(),
    query('tu_ngay').optional().isISO8601(),
    query('den_ngay').optional().isISO8601(),
    query('nguoi_phong_van_id').optional().isMongoId(),
  ],
  handleValidation,
  getAll
);

// GET /api/recruitment/interviews/:id - Lấy chi tiết lịch phỏng vấn
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('ID không hợp lệ')],
  handleValidation,
  getById
);

// POST /api/recruitment/interviews - Tạo lịch phỏng vấn mới
router.post(
  '/',
  [
    allowRoles('admin', 'manager'),
    body('ung_vien_id').isMongoId().withMessage('ID ứng viên không hợp lệ'),
    body('vi_tri_tuyen_dung_id').isMongoId().withMessage('ID vị trí tuyển dụng không hợp lệ'),
    body('loai_phong_van')
      .isIn(['Sơ tuyển', 'Phỏng vấn chuyên môn', 'Phỏng vấn quản lý', 'Phỏng vấn cuối cùng'])
      .withMessage('Loại phỏng vấn không hợp lệ'),
    body('ngay_gio').isISO8601().withMessage('Ngày giờ phỏng vấn không hợp lệ'),
    body('hinh_thuc')
      .optional()
      .isIn(['Trực tiếp', 'Trực tuyến', 'Điện thoại'])
      .withMessage('Hình thức phỏng vấn không hợp lệ'),
    body('dia_diem').optional().isString(),
    body('link_phong_van').optional().isString(),
    body('ghi_chu').optional().isString(),
    body('nguoi_phong_van').optional().isArray(),
    body('nguoi_phong_van.*.nhan_vien_id').optional().isMongoId(),
    body('nguoi_phong_van.*.vai_tro').optional().isString(),
  ],
  handleValidation,
  create
);

// PUT /api/recruitment/interviews/:id - Cập nhật lịch phỏng vấn
router.put(
  '/:id',
  [
    allowRoles('admin', 'manager'),
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    body('loai_phong_van')
      .optional()
      .isIn(['Sơ tuyển', 'Phỏng vấn chuyên môn', 'Phỏng vấn quản lý', 'Phỏng vấn cuối cùng'])
      .withMessage('Loại phỏng vấn không hợp lệ'),
    body('ngay_gio').optional().isISO8601().withMessage('Ngày giờ phỏng vấn không hợp lệ'),
    body('hinh_thuc')
      .optional()
      .isIn(['Trực tiếp', 'Trực tuyến', 'Điện thoại'])
      .withMessage('Hình thức phỏng vấn không hợp lệ'),
  ],
  handleValidation,
  update
);

// PUT /api/recruitment/interviews/:id/result - Cập nhật kết quả phỏng vấn
router.put(
  '/:id/result',
  [
    allowRoles('admin', 'manager'),
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    body('ket_qua_phong_van').isObject().withMessage('Kết quả phỏng vấn không hợp lệ'),
    body('ket_qua_phong_van.danh_gia_tong_quan').optional().isString(),
    body('ket_qua_phong_van.diem_so')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('Điểm số phải từ 0-10'),
    body('ket_qua_phong_van.diem_manh').optional().isArray(),
    body('ket_qua_phong_van.diem_yeu').optional().isArray(),
    body('ket_qua_phong_van.quyet_dinh')
      .optional()
      .isIn(['Đậu', 'Trượt', 'Chưa quyết định'])
      .withMessage('Quyết định không hợp lệ'),
  ],
  handleValidation,
  updateResult
);

// PATCH /api/recruitment/interviews/:id/confirm - Xác nhận lịch phỏng vấn
router.patch(
  '/:id/confirm',
  [
    allowRoles('admin', 'manager'),
    param('id').isMongoId().withMessage('ID không hợp lệ'),
  ],
  handleValidation,
  confirm
);

// PATCH /api/recruitment/interviews/:id/cancel - Hủy lịch phỏng vấn
router.patch(
  '/:id/cancel',
  [
    allowRoles('admin', 'manager'),
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    body('ly_do').optional().isString(),
  ],
  handleValidation,
  cancel
);

// DELETE /api/recruitment/interviews/:id - Xóa lịch phỏng vấn
router.delete(
  '/:id',
  [
    allowRoles('admin', 'manager'),
    param('id').isMongoId().withMessage('ID không hợp lệ'),
  ],
  handleValidation,
  deleteInterview
);

module.exports = router;
