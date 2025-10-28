const ChucDanh = require('../schemas/chucDanh.model.js');

// @desc    Tạo một chức danh mới
exports.createChucDanh = async (req, res) => {
  try {
    const chucDanhMoi = new ChucDanh(req.body);
    await chucDanhMoi.save();
    res.status(201).json(chucDanhMoi);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo chức danh', error: err.message });
  }
};

// @desc    Lấy danh sách tất cả chức danh
const {parseListParams, buildSort, buildSearchQuery} = require('../utils/pagination');

exports.getAllChucDanh = async (req, res) => {
  try {
    const {limit, skip, q, sort, page} = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, ['ten_chuc_danh', 'mo_ta']) };
    const [items, total] = await Promise.all([
      ChucDanh.find(filter).sort(buildSort(sort)).skip(skip).limit(limit),
      ChucDanh.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};

// @desc    Lấy thông tin một chức danh theo ID
exports.getChucDanhById = async (req, res) => {
  try {
    const chucDanh = await ChucDanh.findById(req.params.id);
    if (!chucDanh || chucDanh.da_xoa) {
      return res.status(404).json({ msg: 'Không tìm thấy chức danh' });
    }
    res.json(chucDanh);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy chức danh' });
    }
    res.status(500).send('Lỗi máy chủ');
  }
};

// @desc    Cập nhật thông tin chức danh
exports.updateChucDanh = async (req, res) => {
  try {
    const chucDanh = await ChucDanh.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!chucDanh) {
      return res.status(404).json({ msg: 'Không tìm thấy chức danh' });
    }
    res.json(chucDanh);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật chức danh', error: err.message });
  }
};

// @desc    Xóa một chức danh (soft delete)
exports.deleteChucDanh = async (req, res) => {
  try {
    const chucDanh = await ChucDanh.findByIdAndUpdate(
      req.params.id,
      { da_xoa: true },
      { new: true }
    );
    if (!chucDanh) {
      return res.status(404).json({ msg: 'Không tìm thấy chức danh' });
    }
    res.json({ msg: 'Chức danh đã được xóa thành công' });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};
