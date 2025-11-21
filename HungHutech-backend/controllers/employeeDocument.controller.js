const EmployeeDocument = require('../schemas/employeeDocument.model');
const NhanVien = require('../schemas/nhanVien.model');
const { parseListParams, buildSearchQuery } = require('../utils/pagination');

exports.listDocuments = async (req, res) => {
  try {
    const { limit, skip, page } = parseListParams(req.query);
    const filters = {};
    if (req.query.nhan_vien_id) {
      filters.nhan_vien_id = req.query.nhan_vien_id;
    }
    if (req.query.folder) {
      filters.folder = req.query.folder;
    }
    const keyword = (req.query.q || '').toString().trim();
    const search = keyword
      ? buildSearchQuery(keyword, ['tieu_de', 'mo_ta'])
      : {};
    const finalFilter = { ...filters, ...search };
    const [items, total] = await Promise.all([
      EmployeeDocument.find(finalFilter)
        .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
        .populate('uploaded_by', 'ma_nhan_vien ho_dem ten')
        .sort('-ngay_tao')
        .skip(skip)
        .limit(limit),
      EmployeeDocument.countDocuments(finalFilter),
    ]);
    res.json({
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('listDocuments error', err);
    res.status(500).json({ msg: 'Không thể tải tài liệu', error: err.message });
  }
};

exports.listMyDocuments = async (req, res) => {
  try {
    if (!req.user?.nhan_vien_id) {
      return res.status(400).json({ msg: 'Tai khoan khong gan nhan vien' });
    }
    const { limit, skip, page } = parseListParams(req.query);
    const filters = { nhan_vien_id: req.user.nhan_vien_id };
    if (req.query.folder) filters.folder = req.query.folder;
    const keyword = (req.query.q || '').toString().trim();
    const search = keyword
      ? buildSearchQuery(keyword, ['tieu_de', 'mo_ta'])
      : {};
    const finalFilter = { ...filters, ...search };
    const [items, total] = await Promise.all([
      EmployeeDocument.find(finalFilter)
        .sort('-ngay_tao')
        .skip(skip)
        .limit(limit),
      EmployeeDocument.countDocuments(finalFilter),
    ]);
    res.json({
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('listMyDocuments error', err);
    res.status(500).json({ msg: 'Khong the tai tai lieu', error: err.message });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const doc = await EmployeeDocument.findById(req.params.id)
      .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
      .populate('uploaded_by', 'ma_nhan_vien ho_dem ten');
    if (!doc) return res.status(404).json({ msg: 'Không tìm thấy tài liệu' });
    res.json(doc);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy tài liệu' });
    }
    res.status(500).json({ msg: 'Không thể tải tài liệu', error: err.message });
  }
};

exports.createDocument = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.nhan_vien_id) {
      return res.status(400).json({ msg: 'Thiếu nhân viên' });
    }
    const exists = await NhanVien.findById(payload.nhan_vien_id).select('_id');
    if (!exists) {
      return res.status(404).json({ msg: 'Không tìm thấy nhân viên' });
    }
    const document = new EmployeeDocument({
      ...payload,
      uploaded_by: req.user?.nhan_vien_id || null,
    });
    await document.save();
    res.status(201).json(document);
  } catch (err) {
    console.error('createDocument error', err);
    res.status(400).json({ msg: 'Không thể tạo tài liệu', error: err.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const doc = await EmployeeDocument.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ msg: 'Không tìm thấy tài liệu' });
    res.json(doc);
  } catch (err) {
    console.error('updateDocument error', err);
    res.status(400).json({ msg: 'Không thể cập nhật tài liệu', error: err.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const doc = await EmployeeDocument.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ msg: 'Không tìm thấy tài liệu' });
    res.json({ msg: 'Đã xóa tài liệu' });
  } catch (err) {
    console.error('deleteDocument error', err);
    res.status(400).json({ msg: 'Không thể xóa tài liệu', error: err.message });
  }
};
