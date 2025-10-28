const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const {
    createNhanVien,
    getAllNhanVien,
    getNhanVienById,
    updateNhanVien,
    deleteNhanVien
} = require('../controllers/nhanVien.controller.js');

router.route('/')
    .post(
      [
        body('ma_nhan_vien').optional().isString(), // Optional - tự động tạo nếu không có
        body('ho_dem').isString().notEmpty().withMessage('Họ đệm là bắt buộc'),
        body('ten').isString().notEmpty().withMessage('Tên là bắt buộc'),
        body('lien_he.email_cong_viec').optional().isEmail().withMessage('Email không hợp lệ'),
      ],
      handleValidation,
      createNhanVien,
    )
    .get(getAllNhanVien);

router.route('/:id')
    .get([param('id').isMongoId()], handleValidation, getNhanVienById)
    .put([param('id').isMongoId()], handleValidation, updateNhanVien)
    .delete([param('id').isMongoId()], handleValidation, deleteNhanVien);

module.exports = router;
