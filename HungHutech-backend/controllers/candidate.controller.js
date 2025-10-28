const Candidate = require('../schemas/candidate.model');
const { parseListParams, buildSort, buildSearchQuery } = require('../utils/pagination');

exports.createCandidate = async (req, res) => {
  try {
    const doc = await Candidate.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo ứng viên', error: err.message });
  }
};

exports.getAllCandidates = async (req, res) => {
  try {
    const { limit, skip, q, sort, page } = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, ['ho_ten', 'email', 'dien_thoai']) };
    const [items, total] = await Promise.all([
      Candidate.find(filter).sort(buildSort(sort)).skip(skip).limit(limit),
      Candidate.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.getCandidateById = async (req, res) => {
  try {
    const item = await Candidate.findById(req.params.id);
    if (!item || item.da_xoa) return res.status(404).json({ msg: 'Không tìm thấy ứng viên' });
    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Không tìm thấy ứng viên' });
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.updateCandidate = async (req, res) => {
  try {
    const item = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy ứng viên' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    const item = await Candidate.findByIdAndUpdate(req.params.id, { da_xoa: true }, { new: true });
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy ứng viên' });
    res.json({ msg: 'Ứng viên đã được xóa thành công' });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

