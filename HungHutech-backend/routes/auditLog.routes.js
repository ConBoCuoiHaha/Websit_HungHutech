const express = require('express');
const router = express.Router();
const { param, query, body } = require('express-validator');
const { auth: authenticate, allowRoles } = require('../middlewares/auth');
const { handleValidation } = require('../middlewares/validate');

const {
  getAll,
  getById,
  getStats,
  getByUserId,
  cleanup,
} = require('../controllers/auditLog.controller');

// Tất cả routes đều cần authentication và chỉ admin mới truy cập được
router.use(authenticate);
router.use(allowRoles('admin'));

// GET /api/audit-logs/stats - Thống kê audit logs
router.get(
  '/stats',
  [
    query('fromDate').optional().isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    query('toDate').optional().isISO8601().withMessage('Ngày kết thúc không hợp lệ'),
  ],
  handleValidation,
  getStats
);

// GET /api/audit-logs/user/:userId - Lấy lịch sử của một user
router.get(
  '/user/:userId',
  [
    param('userId').isMongoId().withMessage('User ID không hợp lệ'),
    query('action')
      .optional()
      .isIn(['LOGIN', 'LOGOUT', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'UPLOAD', 'DOWNLOAD', 'OTHER'])
      .withMessage('Action không hợp lệ'),
    query('fromDate').optional().isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    query('toDate').optional().isISO8601().withMessage('Ngày kết thúc không hợp lệ'),
  ],
  handleValidation,
  getByUserId
);

// GET /api/audit-logs - Lấy danh sách audit logs
router.get(
  '/',
  [
    query('userId').optional().isMongoId().withMessage('User ID không hợp lệ'),
    query('action')
      .optional()
      .isIn(['LOGIN', 'LOGOUT', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'UPLOAD', 'DOWNLOAD', 'OTHER'])
      .withMessage('Action không hợp lệ'),
    query('statusCode').optional().isInt().withMessage('Status code không hợp lệ'),
    query('fromDate').optional().isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    query('toDate').optional().isISO8601().withMessage('Ngày kết thúc không hợp lệ'),
  ],
  handleValidation,
  getAll
);

// GET /api/audit-logs/:id - Lấy chi tiết một audit log
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('ID không hợp lệ')],
  handleValidation,
  getById
);

// DELETE /api/audit-logs/cleanup - Xóa logs cũ
router.delete(
  '/cleanup',
  [
    body('daysOld')
      .notEmpty()
      .isInt({ min: 30, max: 365 })
      .withMessage('Chỉ được xóa logs từ 30-365 ngày'),
  ],
  handleValidation,
  cleanup
);

module.exports = router;
