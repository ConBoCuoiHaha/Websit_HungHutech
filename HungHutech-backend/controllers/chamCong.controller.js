const ChamCong = require('../schemas/chamCong.model.js');
const {parseListParams} = require('../utils/pagination');
const NhanVien = require('../schemas/nhanVien.model');

// Lấy ngày hiện tại (local), bỏ giờ/phút/giây
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Nhân viên check-in
exports.clockIn = async (req, res) => {
  const { nhan_vien_id, ghi_chu } = req.body;
  const ngay = getToday();
  try {
    let record = await ChamCong.findOne({ nhan_vien_id, ngay });
    if (record) {
      return res.status(400).json({ msg: 'Hôm nay bạn đã check-in rồi.' });
    }
    record = new ChamCong({ nhan_vien_id, ngay, thoi_gian_vao: new Date(), ghi_chu });
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// Nhân viên check-out
exports.clockOut = async (req, res) => {
  const { nhan_vien_id, ghi_chu } = req.body;
  const ngay = getToday();
  try {
    let record = await ChamCong.findOne({ nhan_vien_id, ngay });
    if (!record) {
      return res.status(404).json({ msg: 'Bạn chưa check-in hôm nay.' });
    }
    if (record.thoi_gian_ra) {
      return res.status(400).json({ msg: 'Bạn đã check-out hôm nay rồi.' });
    }
    record.thoi_gian_ra = new Date();
    if (ghi_chu) record.ghi_chu = ghi_chu;
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// Lịch sử chấm công (có phân trang)
exports.getAttendanceHistory = async (req, res) => {
  const { nhan_vien_id } = req.params;
  const { from, to } = req.query;
  const {limit, skip, page} = parseListParams(req.query);
  try {
    const filter = { nhan_vien_id };
    if (from && to) {
      filter.ngay = { $gte: new Date(from), $lte: new Date(to) };
    }
    const [items, total] = await Promise.all([
      ChamCong.find(filter).sort({ ngay: -1 }).skip(skip).limit(limit),
      ChamCong.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// Admin: Get all attendance records with filters
exports.getAllAttendance = async (req, res) => {
  try {
    const { from, to, nhan_vien_id } = req.query;
    const { limit, skip, page, q } = parseListParams(req.query);
    const filter = {};

    // Build employee filter by dept and/or search query q
    let idsByDept = null;
    if (Array.isArray(req.employeeIdsForDept) && req.employeeIdsForDept.length) idsByDept = req.employeeIdsForDept.map(String);

    let idsByQ = null;
    if (q) {
      const regex = new RegExp(q, 'i');
      const matches = await NhanVien.find({
        da_xoa: false,
        $or: [
          { ma_nhan_vien: regex },
          { ho_dem: regex },
          { ten: regex },
        ],
      }).select('_id');
      idsByQ = matches.map((m) => String(m._id));
    }

    let finalIds = null;
    if (idsByDept && idsByQ) {
      const set = new Set(idsByDept);
      finalIds = idsByQ.filter((x) => set.has(x));
    } else if (idsByDept) finalIds = idsByDept;
    else if (idsByQ) finalIds = idsByQ;

    if (finalIds && finalIds.length) filter.nhan_vien_id = { $in: finalIds };
    else if (nhan_vien_id) filter.nhan_vien_id = nhan_vien_id;
    if (from && to) {
      filter.ngay = { $gte: new Date(from), $lte: new Date(to) };
    }

    const [items, total] = await Promise.all([
      ChamCong.find(filter)
        .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
        .sort({ ngay: -1 })
        .skip(skip)
        .limit(limit),
      ChamCong.countDocuments(filter),
    ]);

    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error getting attendance:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// Admin/Quản lý chỉnh sửa bản ghi chấm công
exports.updateAttendanceRecord = async (req, res) => {
  try {
    const record = await ChamCong.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) {
      return res.status(404).json({ msg: 'Không tìm thấy bản ghi chấm công.' });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};
