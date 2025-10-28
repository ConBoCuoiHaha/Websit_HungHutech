const BacLuong = require('../schemas/bacLuong.model.js');

// @desc    Tạo một bậc lương mới
exports.createBacLuong = async (req, res) => {
  try {
    const bacLuongMoi = new BacLuong(req.body);
    await bacLuongMoi.save();
    res.status(201).json(bacLuongMoi);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo bậc lương', error: err.message });
  }
};

// @desc    Lấy danh sách tất cả bậc lương
const {parseListParams, buildSort, buildSearchQuery} = require('../utils/pagination');

exports.getAllBacLuong = async (req, res) => {
  try {
    const {limit, skip, q, sort, page} = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, ['ten_bac_luong', 'don_vi_tien_te', 'ghi_chu']) };
    const [items, total] = await Promise.all([
      BacLuong.find(filter).sort(buildSort(sort)).skip(skip).limit(limit),
      BacLuong.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};

// @desc    Lấy thông tin một bậc lương theo ID
exports.getBacLuongById = async (req, res) => {
  try {
    const bacLuong = await BacLuong.findById(req.params.id);
    if (!bacLuong || bacLuong.da_xoa) {
      return res.status(404).json({ msg: 'Không tìm thấy bậc lương' });
    }
    res.json(bacLuong);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy bậc lương' });
    }
    res.status(500).send('Lỗi máy chủ');
  }
};

// @desc    Cập nhật thông tin bậc lương
exports.updateBacLuong = async (req, res) => {
  try {
    const bacLuong = await BacLuong.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!bacLuong) {
      return res.status(404).json({ msg: 'Không tìm thấy bậc lương' });
    }
    res.json(bacLuong);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật bậc lương', error: err.message });
  }
};

// @desc    Xóa một bậc lương (soft delete)
exports.deleteBacLuong = async (req, res) => {
  try {
    const bacLuong = await BacLuong.findByIdAndUpdate(
      req.params.id,
      { da_xoa: true },
      { new: true }
    );
    if (!bacLuong) {
      return res.status(404).json({ msg: 'Không tìm thấy bậc lương' });
    }
    res.json({ msg: 'Bậc lương đã được xóa thành công' });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};
