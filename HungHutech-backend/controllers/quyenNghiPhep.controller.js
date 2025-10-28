const QuyenNghiPhep = require('../schemas/quyenNghiPhep.model.js');
const {parseListParams, buildSort, buildSearchQuery} = require('../utils/pagination');

// Tạo (gán) quyền nghỉ phép cho nhân viên
exports.createQuyenNghiPhep = async (req, res) => {
  try {
    const quyenMoi = new QuyenNghiPhep(req.body);
    await quyenMoi.save();
    res.status(201).json(quyenMoi);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo quyền nghỉ phép', error: err.message });
  }
};

// Danh sách quyền nghỉ phép (lọc + phân trang)
exports.getAllQuyenNghiPhep = async (req, res) => {
  try {
    const {limit, skip, q, sort, page} = parseListParams(req.query);
    const filter = {};
    if (req.query.nhan_vien_id) filter.nhan_vien_id = req.query.nhan_vien_id;
    if (req.query.nam) filter.nam = Number(req.query.nam);
    const search = buildSearchQuery(q, ['ghi_chu']);
    Object.assign(filter, search);

    const [items, total] = await Promise.all([
      QuyenNghiPhep.find(filter)
        .populate('nhan_vien_id', 'ho_dem ten')
        .populate('loai_ngay_nghi_id', 'ten')
        .sort(buildSort(sort))
        .skip(skip)
        .limit(limit),
      QuyenNghiPhep.countDocuments(filter),
    ]);

    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};

// Chi tiết quyền nghỉ phép
exports.getQuyenNghiPhepById = async (req, res) => {
  try {
    const quyen = await QuyenNghiPhep.findById(req.params.id)
      .populate('nhan_vien_id', 'ho_dem ten')
      .populate('loai_ngay_nghi_id', 'ten');
    if (!quyen) {
      return res.status(404).json({ msg: 'Không tìm thấy quyền nghỉ phép' });
    }
    res.json(quyen);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy quyền nghỉ phép' });
    }
    res.status(500).send('Lỗi máy chủ');
  }
};

// Cập nhật quyền nghỉ phép
exports.updateQuyenNghiPhep = async (req, res) => {
  try {
    const quyen = await QuyenNghiPhep.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!quyen) {
      return res.status(404).json({ msg: 'Không tìm thấy quyền nghỉ phép' });
    }
    res.json(quyen);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

// Xóa (hard delete) quyền nghỉ phép
exports.deleteQuyenNghiPhep = async (req, res) => {
  try {
    const quyen = await QuyenNghiPhep.findByIdAndDelete(req.params.id);
    if (!quyen) {
      return res.status(404).json({ msg: 'Không tìm thấy quyền nghỉ phép' });
    }
    res.json({ msg: 'Quyền nghỉ phép đã được xóa thành công' });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};

