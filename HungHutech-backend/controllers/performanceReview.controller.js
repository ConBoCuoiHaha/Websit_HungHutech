const PerformanceReview = require('../schemas/performanceReview.model');
const { parseListParams, buildSort } = require('../utils/pagination');

exports.createReview = async (req, res) => {
  try {
    const doc = await PerformanceReview.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo đánh giá', error: err.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const { limit, skip, sort, page } = parseListParams(req.query);
    const filter = {};
    if (req.query.nhan_vien_id) filter.nhan_vien_id = req.query.nhan_vien_id;
    const [items, total] = await Promise.all([
      PerformanceReview.find(filter)
        .populate('nhan_vien_id', 'ho_dem ten')
        .populate('nguoi_danh_gia_id', 'ho_dem ten')
        .populate('ratings.kpi_id', 'ten')
        .sort(buildSort(sort))
        .skip(skip)
        .limit(limit),
      PerformanceReview.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.getReviewById = async (req, res) => {
  try {
    const item = await PerformanceReview.findById(req.params.id)
      .populate('nhan_vien_id', 'ho_dem ten')
      .populate('nguoi_danh_gia_id', 'ho_dem ten')
      .populate('ratings.kpi_id', 'ten');
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy đánh giá' });
    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Không tìm thấy đánh giá' });
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const item = await PerformanceReview.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy đánh giá' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const item = await PerformanceReview.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy đánh giá' });
    res.json({ msg: 'Đánh giá đã được xóa' });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

