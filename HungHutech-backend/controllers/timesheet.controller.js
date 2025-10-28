const Timesheet = require('../schemas/timesheet.model');
const { parseListParams, buildSort } = require('../utils/pagination');

function canActOnTimesheet(req, nhan_vien_id) {
  if (!req.user) return false;
  if (req.user.role === 'admin' || req.user.role === 'manager') return true;
  return String(req.user.nhan_vien_id || '') === String(nhan_vien_id);
}

exports.createTimesheet = async (req, res) => {
  try {
    if (!canActOnTimesheet(req, req.body.nhan_vien_id)) {
      return res.status(403).json({ msg: 'Không có quyền thao tác bảng công' });
    }
    const doc = await Timesheet.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo bảng công', error: err.message });
  }
};

exports.getAllTimesheets = async (req, res) => {
  try {
    const { limit, skip, sort, page } = parseListParams(req.query);
    const filter = {};
    if (req.query.nhan_vien_id) filter.nhan_vien_id = req.query.nhan_vien_id;
    const [items, total] = await Promise.all([
      Timesheet.find(filter)
        .populate('nhan_vien_id', 'ho_dem ten')
        .populate('entries.project_id', 'ten')
        .populate('entries.activity_id', 'ten')
        .sort(buildSort(sort) || '-tuan_bat_dau')
        .skip(skip)
        .limit(limit),
      Timesheet.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

exports.getTimesheetById = async (req, res) => {
  try {
    const item = await Timesheet.findById(req.params.id)
      .populate('nhan_vien_id', 'ho_dem ten')
      .populate('entries.project_id', 'ten')
      .populate('entries.activity_id', 'ten');
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy bảng công' });
    if (!canActOnTimesheet(req, item.nhan_vien_id)) return res.status(403).json({ msg: 'Không có quyền' });
    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Không tìm thấy bảng công' });
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.updateTimesheet = async (req, res) => {
  try {
    const item = await Timesheet.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy bảng công' });
    if (!canActOnTimesheet(req, item.nhan_vien_id)) return res.status(403).json({ msg: 'Không có quyền' });
    Object.assign(item, req.body);
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

exports.updateTimesheetStatus = async (req, res) => {
  try {
    const item = await Timesheet.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy bảng công' });
    // chỉ admin/manager được duyệt/từ chối
    if (!(req.user && (req.user.role === 'admin' || req.user.role === 'manager'))) {
      return res.status(403).json({ msg: 'Chỉ quản lý hoặc admin được duyệt bảng công' });
    }
    const { trang_thai } = req.body; // 'Cho duyet' | 'Da duyet' | 'Bi tu choi'
    item.trang_thai = trang_thai;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật trạng thái', error: err.message });
  }
};

exports.approveTimesheet = async (req, res) => {
  try {
    const item = await Timesheet.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Không tìm thấy bảng công' });

    // chỉ admin/manager được duyệt/từ chối
    if (!(req.user && (req.user.role === 'admin' || req.user.role === 'manager'))) {
      return res.status(403).json({ msg: 'Chỉ quản lý hoặc admin được duyệt bảng công' });
    }

    const { trang_thai, ghi_chu } = req.body;
    item.trang_thai = trang_thai;

    if (ghi_chu) {
      item.ghi_chu_quan_ly = ghi_chu;
    }

    if (req.user.nhan_vien_id) {
      item.nguoi_duyet_id = req.user.nhan_vien_id;
    }

    await item.save();

    // Populate để trả về đầy đủ thông tin
    await item.populate([
      { path: 'nhan_vien_id', select: 'ho_dem ten' },
      { path: 'nguoi_duyet_id', select: 'ho_dem ten' },
      { path: 'entries.project_id', select: 'ten' },
      { path: 'entries.activity_id', select: 'ten' }
    ]);

    res.json(item);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể duyệt bảng công', error: err.message });
  }
};

