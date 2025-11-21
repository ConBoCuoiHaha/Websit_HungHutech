const YeuCauNghiPhep = require('../schemas/yeuCauNghiPhep.model.js');
const QuyenNghiPhep = require('../schemas/quyenNghiPhep.model.js');
const {parseListParams, buildSort, buildSearchQuery} = require('../utils/pagination');
const NhanVien = require('../schemas/nhanVien.model');
const { sendMail } = require('../utils/mailer');
const timeRuleEngine = require('../services/timeRuleEngine');

function queueLeaveRange(leaveDoc) {
  if (!leaveDoc?.nhan_vien_id || !leaveDoc.ngay_bat_dau) return;
  const start = new Date(leaveDoc.ngay_bat_dau);
  const end = new Date(leaveDoc.ngay_ket_thuc || leaveDoc.ngay_bat_dau);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
  const days = Math.round((end - start) / 86400000) + 1;
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    timeRuleEngine.queueRecalc(leaveDoc.nhan_vien_id, date);
  }
}


// Nhân viên tạo yêu cầu
exports.createYeuCauNghiPhep = async (req, res) => {
  try {
    const payload = {...req.body};
    if (req.user?.role === 'employee' || req.user?.nhan_vien_id) {
      if (!req.user?.nhan_vien_id) {
        return res.status(400).json({ msg: 'Tai khoan khong gan voi nhan vien' });
      }
      payload.nhan_vien_id = req.user.nhan_vien_id;
    }
    if (!payload.nhan_vien_id) {
      return res.status(400).json({ msg: 'Thieu nhan vien' });
    }
    const yeuCau = new YeuCauNghiPhep(payload);
    await yeuCau.save();
    res.status(201).json(yeuCau);
  } catch (err) {
    res.status(400).json({ msg: 'Khong the tao yeu cau', error: err.message });
  }
};

// Danh sách yêu cầu (phân trang, lọc theo nhân viên, trạng thái, thời gian)
exports.getAllYeuCauNghiPhep = async (req, res) => {
  try {
    const {limit, skip, q, sort, page} = parseListParams(req.query);
    const filter = {};
    if (req.query.nhan_vien_id) filter.nhan_vien_id = req.query.nhan_vien_id;
    if (req.query.trang_thai) filter.trang_thai = req.query.trang_thai;
    if (req.query.from && req.query.to) {
      filter.ngay_bat_dau = { $gte: new Date(req.query.from) };
      filter.ngay_ket_thuc = { $lte: new Date(req.query.to) };
    }
    Object.assign(filter, buildSearchQuery(q, ['ly_do', 'ghi_chu_quan_ly']));

    const [items, total] = await Promise.all([
      YeuCauNghiPhep.find(filter)
        .populate('nhan_vien_id', 'ho_dem ten')
        .populate('loai_ngay_nghi_id', 'ten')
        .sort(buildSort(sort))
        .skip(skip)
        .limit(limit),
      YeuCauNghiPhep.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ msg: 'Loi may chu', error: err.message });
  }
};

exports.listMyRequests = async (req, res) => {
  try {
    if (!req.user?.nhan_vien_id) {
      return res.status(400).json({ msg: 'Tai khoan khong gan voi nhan vien' });
    }
    const {limit, skip, q, page} = parseListParams(req.query);
    const filter = { nhan_vien_id: req.user.nhan_vien_id };
    if (req.query.trang_thai) filter.trang_thai = req.query.trang_thai;
    const search = buildSearchQuery(q, ['ly_do']);
    Object.assign(filter, search);
    const [items, total] = await Promise.all([
      YeuCauNghiPhep.find(filter)
        .populate('loai_ngay_nghi_id', 'ten')
        .sort('-ngay_tao')
        .skip(skip)
        .limit(limit),
      YeuCauNghiPhep.countDocuments(filter),
    ]);
    res.json({
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ msg: 'Khong the tai danh sach', error: err.message });
  }
};

// Chi tiết yêu cầu
exports.getYeuCauNghiPhepById = async (req, res) => {
  try {
    const yeuCau = await YeuCauNghiPhep.findById(req.params.id)
      .populate('nhan_vien_id', 'ho_dem ten')
      .populate('loai_ngay_nghi_id', 'ten');
    if (!yeuCau) {
      return res.status(404).json({ msg: 'Khong tim thay yeu cau' });
    }
    res.json(yeuCau);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Khong tim thay yeu cau' });
    }
    res.status(500).json({ msg: 'Loi may chu', error: err.message });
  }
};

// Cập nhật trạng thái duyệt/từ chối
exports.updateYeuCauStatus = async (req, res) => {
  try {
    const {trang_thai, nguoi_duyet_id, ghi_chu_quan_ly} = req.body;
    const yeuCau = await YeuCauNghiPhep.findById(req.params.id);
    if (!yeuCau) {
      return res.status(404).json({ msg: 'Khong tim thay yeu cau' });
    }

    // Nếu duyệt (Da duyet) thì tăng số ngày đã sử dụng
    if (trang_thai === 'Da duyet') {
      const nam = new Date(yeuCau.ngay_bat_dau).getFullYear();
      await QuyenNghiPhep.findOneAndUpdate(
        {
          nhan_vien_id: yeuCau.nhan_vien_id,
          loai_ngay_nghi_id: yeuCau.loai_ngay_nghi_id,
          nam: nam,
        },
        { $inc: { so_ngay_da_su_dung: yeuCau.so_ngay } },
      );
    }

    yeuCau.trang_thai = trang_thai;
    if (nguoi_duyet_id) yeuCau.nguoi_duyet_id = nguoi_duyet_id;
    if (ghi_chu_quan_ly !== undefined) yeuCau.ghi_chu_quan_ly = ghi_chu_quan_ly;
    await yeuCau.save();
    queueLeaveRange(yeuCau);
    try {
      const nv = await NhanVien.findById(yeuCau.nhan_vien_id);
      const to = nv?.lien_he?.email_cong_viec;
      if (to) {
        await sendMail({
          from: process.env.MAIL_FROM || 'no-reply@example.com',
          to,
          subject: `Yeu cau nghi phep ${trang_thai}`,
          text: `Yeu cau nghi phep cua ban da duoc cap nhat trang thai: ${trang_thai}.`,
        });
      }
    } catch (e) {
      // ignore mail errors
    }
    res.json(yeuCau);
  } catch (err) {
    res.status(500).json({ msg: 'Loi may chu', error: err.message });
  }
};

// Nhân viên hủy yêu cầu
exports.cancelYeuCau = async (req, res) => {
  try {
    const yeuCau = await YeuCauNghiPhep.findById(req.params.id);
    if (!yeuCau) {
      return res.status(404).json({ msg: 'Khong tim thay yeu cau' });
    }
    if (yeuCau.trang_thai !== 'Cho duyet') {
      return res.status(400).json({ msg: 'Khong the huy yeu cau da xu ly' });
    }
    yeuCau.trang_thai = 'Da huy';
    await yeuCau.save();
    queueLeaveRange(yeuCau);
    res.json(yeuCau);
  } catch (err) {
    res.status(500).json({ msg: 'Loi may chu', error: err.message });
  }
};

