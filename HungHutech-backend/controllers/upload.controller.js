const fs = require('fs');
const path = require('path');
const multer = require('multer');
const FileObject = require('../schemas/file.model');
const NhanVien = require('../schemas/nhanVien.model');
const YeuCauNghiPhep = require('../schemas/yeuCauNghiPhep.model');
const { audit } = require('../utils/auditHandler');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, unique + '-' + safe);
  },
});

const limits = { fileSize: 10 * 1024 * 1024 };
const fileFilter = (_req, file, cb) => {
  // basic allowlist
  const allowed = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Định dạng tệp không được hỗ trợ'));
};

const uploader = multer({ storage, limits, fileFilter });

function makeUploadHandler(ownerType) {
  return async function (req, res) {
    try {
      let exists = null;
      if (ownerType === 'NhanVien') {
        exists = await NhanVien.findById(req.params.id);
      } else if (ownerType === 'YeuCauNghiPhep') {
        exists = await YeuCauNghiPhep.findById(req.params.id);
      }
      if (!exists) return res.status(404).json({ msg: 'Không tìm thấy bản ghi' });

      const file = req.file;
      const saved = await FileObject.create({
        path: path.relative(path.join(__dirname, '..'), file.path),
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: file.size,
        owner_type: ownerType,
        owner_id: exists._id,
      });

      // If uploading employee photo, update avatar_url
      if (ownerType === 'NhanVien') {
        const avatarPath = saved.path.replace(/\\/g, '/');
        await NhanVien.findByIdAndUpdate(exists._id, {
          avatar_url: `/uploads/${avatarPath.replace(/^uploads\//, '')}`,
        });
      }

      await audit('upload', ownerType, exists._id, { fileId: saved._id }, req);
      res.status(201).json(saved);
    } catch (err) {
      res.status(400).json({ msg: 'Không thể upload tệp', error: err.message });
    }
  };
}

async function listFiles(req, res) {
  try {
    const { owner_type, owner_id } = req.query;
    const items = await FileObject.find({ owner_type: owner_type, owner_id });
    res.json(items);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
}

async function removeFile(req, res) {
  try {
    const file = await FileObject.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'Không tìm thấy tệp' });
    // Only admin/manager or owner can delete; rely on higher-level RBAC for simplicity
    const abs = path.join(__dirname, '..', file.path);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
    await file.deleteOne();
    await audit('delete_file', file.owner_type, file.owner_id, { fileId: file._id }, req);
    res.json({ msg: 'Đã xóa tệp' });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
}

module.exports = {
  uploader,
  uploadNhanVienPhoto: [uploader.single('file'), makeUploadHandler('NhanVien')],
  uploadYeuCauAttachment: [uploader.single('file'), makeUploadHandler('YeuCauNghiPhep')],
  listFiles,
  removeFile,
};

