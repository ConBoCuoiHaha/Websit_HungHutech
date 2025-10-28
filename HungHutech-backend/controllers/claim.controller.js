const Claim = require('../schemas/claim.model');
const { parseListParams, buildSort } = require('../utils/pagination');

exports.createClaim = async (req, res) => {
  try {
    const doc = await Claim.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo đề nghị chi phí', error: err.message });
  }
};

exports.getAllClaims = async (req, res) => {
  try {
    const { limit, skip, sort, page } = parseListParams(req.query);
    const filter = {};
    if (req.query.nhan_vien_id) filter.nhan_vien_id = req.query.nhan_vien_id;
    if (req.query.trang_thai) filter.trang_thai = req.query.trang_thai;
    const [items, total] = await Promise.all([
      Claim.find(filter).populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten').sort(buildSort(sort) || '-ngay_tao').skip(skip).limit(limit),
      Claim.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error getting claims:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

exports.getClaimById = async (req, res) => {
  try {
    const item = await Claim.findById(req.params.id).populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten');
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy đề nghị' });
    res.json(item);
  } catch (err) {
    console.error('Error getting claim by id:', err);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Không tìm thấy đề nghị' });
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

exports.updateClaim = async (req, res) => {
  try {
    const item = await Claim.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy đề nghị' });
    Object.assign(item, req.body);
    // cập nhật tổng tiền
    item.tong_tien = (item.items || []).reduce((s, it) => s + (it.so_tien || 0), 0);
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

exports.deleteClaim = async (req, res) => {
  try {
    const item = await Claim.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy đề nghị' });
    res.json({ msg: 'Đề nghị đã được xóa' });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

