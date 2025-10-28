const KPI = require('../schemas/kpi.model');
const { parseListParams, buildSort, buildSearchQuery } = require('../utils/pagination');

exports.createKPI = async (req, res) => {
  try {
    const doc = await KPI.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo KPI', error: err.message });
  }
};

exports.getAllKPIs = async (req, res) => {
  try {
    const { limit, skip, q, sort, page } = parseListParams(req.query);
    const filter = { ...buildSearchQuery(q, ['ten', 'mo_ta']) };
    const [items, total] = await Promise.all([
      KPI.find(filter).sort(buildSort(sort)).skip(skip).limit(limit),
      KPI.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.getKPIById = async (req, res) => {
  try {
    const item = await KPI.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy KPI' });
    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Không tìm thấy KPI' });
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.updateKPI = async (req, res) => {
  try {
    const item = await KPI.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy KPI' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

exports.deleteKPI = async (req, res) => {
  try {
    const item = await KPI.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy KPI' });
    res.json({ msg: 'KPI đã được xóa' });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

