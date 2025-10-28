const express = require('express');
const router = express.Router();
const { auth, allowRoles } = require('../utils/authHandler');
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { uploadNhanVienPhoto, uploadYeuCauAttachment, listFiles, removeFile } = require('../controllers/upload.controller');

// Upload ảnh nhân viên
router.post('/nhanvien/:id/photo', [auth, allowRoles('admin','manager') ,param('id').isMongoId()], handleValidation, ...uploadNhanVienPhoto);

// Upload đính kèm yêu cầu nghỉ phép (nhân viên/manager/admin)
router.post('/yeucaunghiphep/:id/attachments', [auth, param('id').isMongoId()], handleValidation, ...uploadYeuCauAttachment);

// Danh sách tệp theo owner
router.get('/files', [auth, query('owner_type').isString(), query('owner_id').isMongoId()], handleValidation, listFiles);

// Xóa tệp theo id
router.delete('/files/:id', [auth, allowRoles('admin','manager'), param('id').isMongoId()], handleValidation, removeFile);

module.exports = router;

