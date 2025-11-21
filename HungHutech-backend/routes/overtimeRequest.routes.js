const express = require('express');
const {body, param, query} = require('express-validator');
const {handleValidation} = require('../utils/validator');
const controller = require('../controllers/overtimeRequest.controller');

const router = express.Router();

router
  .route('/')
  .post(
    [
      body('nhan_vien_id').optional().isMongoId(),
      body('ngay').isISO8601(),
      body().custom((value) => {
        if (!value.gio_bat_dau && !value.thoi_gian_bat_dau) {
          throw new Error('Thieu gio bat dau');
        }
        if (!value.gio_ket_thuc && !value.thoi_gian_ket_thuc) {
          throw new Error('Thieu gio ket thuc');
        }
        return true;
      }),
    ],
    handleValidation,
    controller.createRequest,
  )
  .get(
    [
      query('nhan_vien_id').optional().isMongoId(),
      query('from').optional().isISO8601(),
      query('to').optional().isISO8601(),
      query('trang_thai').optional().isString(),
    ],
    handleValidation,
    controller.listRequests,
  );

router.get('/alerts', controller.getAlerts);

router.get(
  '/my',
  [query('trang_thai').optional().isString()],
  handleValidation,
  controller.listMyRequests,
);

router
  .route('/:id/status')
  .put(
    [
      param('id').isMongoId(),
      body('trang_thai').isIn(['Da duyet', 'Bi tu choi']),
      body('ghi_chu_quan_ly').optional().isString(),
    ],
    handleValidation,
    controller.updateStatus,
  );

router
  .route('/:id/cancel')
  .put([param('id').isMongoId()], handleValidation, controller.cancelRequest);

module.exports = router;
