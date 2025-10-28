const TrangThaiLaoDong = require('../schemas/trangThaiLaoDong.model.js');
const {parseListParams, buildSort, buildSearchQuery} = require('../utils/pagination');

exports.createTrangThaiLaoDong = async (req, res) => {
  try {
    const trangThaiMoi = new TrangThaiLaoDong(req.body);
    await trangThaiMoi.save();
    res.status(201).json(trangThaiMoi);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo trạng thái lao động', error: err.message });
  }
};

exports.getAllTrangThaiLaoDong = async (req, res) => {
  try {
    const {limit, skip, q, sort, page} = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, ['ten', 'mo_ta']) };
    const [items, total] = await Promise.all([
      TrangThaiLaoDong.find(filter).sort(buildSort(sort)).skip(skip).limit(limit),
      TrangThaiLaoDong.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};

exports.getTrangThaiLaoDongById = async (req, res) => {
  try {
    const trangThai = await TrangThaiLaoDong.findById(req.params.id);
    if (!trangThai || trangThai.da_xoa) {
      return res.status(404).json({ msg: 'Không tìm thấy trạng thái lao động' });
    }
    res.json(trangThai);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy trạng thái lao động' });
    }
    res.status(500).send('Lỗi máy chủ');
  }
};

exports.updateTrangThaiLaoDong = async (req, res) => {
  try {
    const trangThai = await TrangThaiLaoDong.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!trangThai) {
      return res.status(404).json({ msg: 'Không tìm thấy trạng thái lao động' });
    }
    res.json(trangThai);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

exports.deleteTrangThaiLaoDong = async (req, res) => {
  try {
    const trangThai = await TrangThaiLaoDong.findByIdAndUpdate(
      req.params.id,
      { da_xoa: true },
      { new: true }
    );
    if (!trangThai) {
      return res.status(404).json({ msg: 'Không tìm thấy trạng thái lao động' });
    }
    res.json({ msg: 'Trạng thái lao động đã được xóa thành công' });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};

