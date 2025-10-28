const Project = require('../schemas/project.model');
const { parseListParams, buildSort, buildSearchQuery } = require('../utils/pagination');

exports.createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo dự án', error: err.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const { limit, skip, q, sort, page } = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, ['ten', 'mo_ta']) };
    const [items, total] = await Promise.all([
      Project.find(filter).sort(buildSort(sort)).skip(skip).limit(limit),
      Project.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const item = await Project.findById(req.params.id);
    if (!item || item.da_xoa) return res.status(404).json({ msg: 'Không tìm thấy dự án' });
    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Không tìm thấy dự án' });
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const item = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy dự án' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const item = await Project.findByIdAndUpdate(req.params.id, { da_xoa: true }, { new: true });
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy dự án' });
    res.json({ msg: 'Dự án đã được xóa thành công' });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

