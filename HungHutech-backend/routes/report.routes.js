const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  generateReport,
  exportReportCSV,
} = require('../controllers/report.controller');

// GET /api/reports - Get all saved reports
router.get('/', getAllReports);

// GET /api/reports/:id - Get specific report configuration
router.get(
  '/:id',
  [param('id').isMongoId()],
  handleValidation,
  getReportById
);

// POST /api/reports - Create new report configuration
router.post(
  '/',
  [
    body('ten_bao_cao').isString().notEmpty().withMessage('Tên báo cáo là bắt buộc'),
    body('loai_bao_cao')
      .isString()
      .isIn(['Nhan vien', 'Cham cong', 'Nghi phep', 'Boi hoan', 'Luong', 'Hieu suat'])
      .withMessage('Loại báo cáo không hợp lệ'),
    body('tieu_chi').optional().isArray(),
    body('cot_hien_thi').optional().isArray(),
    body('sap_xep').optional().isObject(),
  ],
  handleValidation,
  createReport
);

// PUT /api/reports/:id - Update report configuration
router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('ten_bao_cao').optional().isString().notEmpty(),
    body('loai_bao_cao')
      .optional()
      .isString()
      .isIn(['Nhan vien', 'Cham cong', 'Nghi phep', 'Boi hoan', 'Luong', 'Hieu suat']),
    body('tieu_chi').optional().isArray(),
    body('cot_hien_thi').optional().isArray(),
    body('sap_xep').optional().isObject(),
  ],
  handleValidation,
  updateReport
);

// DELETE /api/reports/:id - Delete report configuration
router.delete(
  '/:id',
  [param('id').isMongoId()],
  handleValidation,
  deleteReport
);

// POST /api/reports/generate - Generate report data with given criteria
router.post(
  '/generate',
  [
    body('loai_bao_cao')
      .isString()
      .isIn(['Nhan vien', 'Cham cong', 'Nghi phep', 'Boi hoan', 'Luong', 'Hieu suat'])
      .withMessage('Loại báo cáo không hợp lệ'),
    body('tieu_chi').optional().isArray(),
    body('cot_hien_thi').optional().isArray(),
    body('sap_xep').optional().isObject(),
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 1000 }),
  ],
  handleValidation,
  generateReport
);

// GET /api/reports/export/:id - Export report to CSV
router.get(
  '/export/:id',
  [param('id').isMongoId()],
  handleValidation,
  exportReportCSV
);

module.exports = router;
