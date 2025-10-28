const LoaiNgayNghi = require('../schemas/loaiNgayNghi.model.js');
const {parseListParams, buildSort, buildSearchQuery} = require('../utils/pagination');

// Tạo một loại ngày nghỉ mới
exports.createLoaiNgayNghi = async (req, res) => {
  try {
    const loaiNgayNghiMoi = new LoaiNgayNghi(req.body);
    await loaiNgayNghiMoi.save();
    res.status(201).json(loaiNgayNghiMoi);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo loại ngày nghỉ', error: err.message });
  }
};

// Danh sách loại ngày nghỉ (phân trang/tìm kiếm)
exports.getAllLoaiNgayNghi = async (req, res) => {
  try {
    const {limit, skip, q, sort, page} = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, ['ten', 'mo_ta']) };
    const [items, total] = await Promise.all([
      LoaiNgayNghi.find(filter).sort(buildSort(sort)).skip(skip).limit(limit),
      LoaiNgayNghi.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};

// Chi tiết loại ngày nghỉ
exports.getLoaiNgayNghiById = async (req, res) => {
  try {
    const loaiNgayNghi = await LoaiNgayNghi.findById(req.params.id);
    if (!loaiNgayNghi || loaiNgayNghi.da_xoa) {
      return res.status(404).json({ msg: 'Không tìm thấy loại ngày nghỉ' });
    }
    res.json(loaiNgayNghi);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy loại ngày nghỉ' });
    }
    res.status(500).send('Lỗi máy chủ');
  }
};

// Cập nhật loại ngày nghỉ
exports.updateLoaiNgayNghi = async (req, res) => {
  try {
    const loaiNgayNghi = await LoaiNgayNghi.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!loaiNgayNghi) {
      return res.status(404).json({ msg: 'Không tìm thấy loại ngày nghỉ' });
    }
    res.json(loaiNgayNghi);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

// Xóa (soft) loại ngày nghỉ
exports.deleteLoaiNgayNghi = async (req, res) => {
  try {
    const loaiNgayNghi = await LoaiNgayNghi.findByIdAndUpdate(
      req.params.id,
      { da_xoa: true },
      { new: true }
    );
    if (!loaiNgayNghi) {
      return res.status(404).json({ msg: 'Không tìm thấy loại ngày nghỉ' });
    }
    res.json({ msg: 'Loại ngày nghỉ đã được xóa thành công' });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};

