const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { auth: authenticate, allowRoles } = require('../middlewares/auth');
const { handleValidation } = require('../middlewares/validate');

const {
  getAll,
  getById,
  create,
  update,
  delete: deleteSite,
  toggleActive,
  getNearby,
} = require('../controllers/site.controller');

// Tất cả routes đều cần authentication
router.use(authenticate);

// GET /api/sites/nearby - Tìm địa điểm gần nhất (public cho mobile app)
router.get(
  '/nearby',
  [
    query('longitude').notEmpty().isFloat({ min: -180, max: 180 }).withMessage('Longitude không hợp lệ'),
    query('latitude').notEmpty().isFloat({ min: -90, max: 90 }).withMessage('Latitude không hợp lệ'),
    query('maxDistance').optional().isInt({ min: 10, max: 50000 }).withMessage('Khoảng cách tối đa không hợp lệ'),
  ],
  handleValidation,
  getNearby
);

// GET /api/sites - Lấy danh sách địa điểm (Admin/Manager)
router.get('/', allowRoles('admin', 'manager'), getAll);

// GET /api/sites/:id - Lấy chi tiết địa điểm (Admin/Manager)
router.get(
  '/:id',
  [allowRoles('admin', 'manager'), param('id').isMongoId().withMessage('ID không hợp lệ')],
  handleValidation,
  getById
);

// POST /api/sites - Tạo địa điểm mới (Admin only)
router.post(
  '/',
  [
    allowRoles('admin'),
    body('name').notEmpty().trim().withMessage('Tên địa điểm là bắt buộc'),
    body('address').notEmpty().trim().withMessage('Địa chỉ là bắt buộc'),
    body('longitude')
      .notEmpty()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Kinh độ phải từ -180 đến 180'),
    body('latitude')
      .notEmpty()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Vĩ độ phải từ -90 đến 90'),
    body('radius')
      .optional()
      .isInt({ min: 10, max: 1000 })
      .withMessage('Bán kính phải từ 10m đến 1000m'),
    body('isActive').optional().isBoolean().withMessage('isActive phải là boolean'),
  ],
  handleValidation,
  create
);

// PUT /api/sites/:id - Cập nhật địa điểm (Admin only)
router.put(
  '/:id',
  [
    allowRoles('admin'),
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    body('name').optional().trim().notEmpty().withMessage('Tên địa điểm không được để trống'),
    body('address').optional().trim().notEmpty().withMessage('Địa chỉ không được để trống'),
    body('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Kinh độ phải từ -180 đến 180'),
    body('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Vĩ độ phải từ -90 đến 90'),
    body('radius')
      .optional()
      .isInt({ min: 10, max: 1000 })
      .withMessage('Bán kính phải từ 10m đến 1000m'),
    body('isActive').optional().isBoolean().withMessage('isActive phải là boolean'),
  ],
  handleValidation,
  update
);

// PATCH /api/sites/:id/toggle - Bật/Tắt địa điểm (Admin only)
router.patch(
  '/:id/toggle',
  [allowRoles('admin'), param('id').isMongoId().withMessage('ID không hợp lệ')],
  handleValidation,
  toggleActive
);

// DELETE /api/sites/:id - Xóa địa điểm (Admin only)
router.delete(
  '/:id',
  [allowRoles('admin'), param('id').isMongoId().withMessage('ID không hợp lệ')],
  handleValidation,
  deleteSite
);

module.exports = router;
