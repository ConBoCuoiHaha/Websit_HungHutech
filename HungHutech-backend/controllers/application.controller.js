const Application = require('../schemas/application.model');
const { parseListParams, buildSort } = require('../utils/pagination');

exports.createApplication = async (req, res) => {
  try {
    const doc = await Application.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo hồ sơ ứng tuyển', error: err.message });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    const { limit, skip, sort, page } = parseListParams(req.query);
    const filter = {};
    if (req.query.vacancy_id) filter.vacancy_id = req.query.vacancy_id;
    if (req.query.candidate_id) filter.candidate_id = req.query.candidate_id;
    const [items, total] = await Promise.all([
      Application.find(filter)
        .populate('vacancy_id', 'tieu_de')
        .populate('candidate_id', 'ho_ten email')
        .sort(buildSort(sort))
        .skip(skip)
        .limit(limit),
      Application.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    const item = await Application.findById(req.params.id)
      .populate('vacancy_id', 'tieu_de')
      .populate('candidate_id', 'ho_ten email');
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy hồ sơ' });
    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Không tìm thấy hồ sơ' });
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const item = await Application.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy hồ sơ' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

exports.deleteApplication = async (req, res) => {
  try {
    const item = await Application.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy hồ sơ' });
    res.json({ msg: 'Hồ sơ đã được xóa' });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

