const Vacancy = require('../schemas/vacancy.model');
const { parseListParams, buildSort, buildSearchQuery } = require('../utils/pagination');

exports.createVacancy = async (req, res) => {
  try {
    const doc = await Vacancy.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo vị trí tuyển dụng', error: err.message });
  }
};

exports.getAllVacancies = async (req, res) => {
  try {
    const { limit, skip, q, sort, page } = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, ['tieu_de', 'mo_ta']) };
    const [items, total] = await Promise.all([
      Vacancy.find(filter).populate('hiring_manager_id', 'ho_dem ten').populate('dia_diem_id', 'ten').sort(buildSort(sort)).skip(skip).limit(limit),
      Vacancy.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.getVacancyById = async (req, res) => {
  try {
    const item = await Vacancy.findById(req.params.id).populate('hiring_manager_id', 'ho_dem ten').populate('dia_diem_id', 'ten');
    if (!item || item.da_xoa) return res.status(404).json({ msg: 'Không tìm thấy vị trí' });
    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Không tìm thấy vị trí' });
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.updateVacancy = async (req, res) => {
  try {
    const item = await Vacancy.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy vị trí' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

exports.deleteVacancy = async (req, res) => {
  try {
    const item = await Vacancy.findByIdAndUpdate(req.params.id, { da_xoa: true }, { new: true });
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy vị trí' });
    res.json({ msg: 'Vị trí đã được xóa thành công' });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

