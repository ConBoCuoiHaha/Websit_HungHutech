const Activity = require('../schemas/activity.model');
const Project = require('../schemas/project.model');
const { parseListParams, buildSort, buildSearchQuery } = require('../utils/pagination');

exports.createActivity = async (req, res) => {
  try {
    const project = await Project.findById(req.body.project_id);
    if (!project || project.da_xoa) return res.status(404).json({ msg: 'Không tìm thấy dự án' });
    const item = await Activity.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo hoạt động', error: err.message });
  }
};

exports.getAllActivities = async (req, res) => {
  try {
    const { limit, skip, q, sort, page } = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, ['ten']) };
    if (req.query.project_id) filter.project_id = req.query.project_id;
    const [items, total] = await Promise.all([
      Activity.find(filter).populate('project_id', 'ten').sort(buildSort(sort)).skip(skip).limit(limit),
      Activity.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

exports.getActivityById = async (req, res) => {
  try {
    const item = await Activity.findById(req.params.id).populate('project_id', 'ten');
    if (!item || item.da_xoa) return res.status(404).json({ msg: 'Không tìm thấy hoạt động' });
    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Không tìm thấy hoạt động' });
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const updateData = {...req.body};

    // Ensure project_id is an ObjectId, not a populated object
    if (updateData.project_id && typeof updateData.project_id === 'object' && updateData.project_id._id) {
      updateData.project_id = updateData.project_id._id;
    }

    const item = await Activity.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('project_id', 'ten');
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy hoạt động' });
    res.json(item);
  } catch (err) {
    console.error('Error updating activity:', err);
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const item = await Activity.findByIdAndUpdate(req.params.id, { da_xoa: true }, { new: true });
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy hoạt động' });
    res.json({ msg: 'Hoạt động đã được xóa thành công' });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

