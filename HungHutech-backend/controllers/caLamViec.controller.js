const CaLamViec = require('../schemas/caLamViec.model.js');
const { parseListParams, buildSort, buildSearchQuery } = require('../utils/pagination');

// @desc    Tạo ca làm việc mới
exports.createCaLamViec = async (req, res) => {
  try {
    const caLamViecMoi = new CaLamViec(req.body);
    await caLamViecMoi.save();
    res.status(201).json(caLamViecMoi);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo ca làm việc', error: err.message });
  }
};

// @desc    Lấy danh sách tất cả ca làm việc
exports.getAllCaLamViec = async (req, res) => {
  try {
    const { limit, skip, q, sort, page } = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, ['ten_ca', 'mo_ta']) };

    const [items, total] = await Promise.all([
      CaLamViec.find(filter).sort(buildSort(sort)).skip(skip).limit(limit),
      CaLamViec.countDocuments(filter),
    ]);

    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// @desc    Lấy thông tin một ca làm việc theo ID
exports.getCaLamViecById = async (req, res) => {
  try {
    const caLamViec = await CaLamViec.findById(req.params.id);
    if (!caLamViec || caLamViec.da_xoa) {
      return res.status(404).json({ msg: 'Không tìm thấy ca làm việc' });
    }
    res.json(caLamViec);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy ca làm việc' });
    }
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// @desc    Cập nhật thông tin ca làm việc
exports.updateCaLamViec = async (req, res) => {
  try {
    const caLamViec = await CaLamViec.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!caLamViec) {
      return res.status(404).json({ msg: 'Không tìm thấy ca làm việc' });
    }
    res.json(caLamViec);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật ca làm việc', error: err.message });
  }
};

// @desc    Xóa một ca làm việc (soft delete)
exports.deleteCaLamViec = async (req, res) => {
  try {
    const caLamViec = await CaLamViec.findByIdAndUpdate(
      req.params.id,
      { da_xoa: true },
      { new: true }
    );
    if (!caLamViec) {
      return res.status(404).json({ msg: 'Không tìm thấy ca làm việc' });
    }
    res.json({ msg: 'Ca làm việc đã được xóa thành công' });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};
