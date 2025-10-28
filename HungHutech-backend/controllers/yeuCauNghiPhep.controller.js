const YeuCauNghiPhep = require('../schemas/yeuCauNghiPhep.model.js');
const QuyenNghiPhep = require('../schemas/quyenNghiPhep.model.js');
const {parseListParams, buildSort, buildSearchQuery} = require('../utils/pagination');
const NhanVien = require('../schemas/nhanVien.model');
const { sendMail } = require('../utils/mailer');

// Nhân viên tạo yêu cầu
exports.createYeuCauNghiPhep = async (req, res) => {
  try {
    const yeuCau = new YeuCauNghiPhep(req.body);
    await yeuCau.save();
    res.status(201).json(yeuCau);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo yêu cầu', error: err.message });
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
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// Chi tiết yêu cầu
exports.getYeuCauNghiPhepById = async (req, res) => {
  try {
    const yeuCau = await YeuCauNghiPhep.findById(req.params.id)
      .populate('nhan_vien_id', 'ho_dem ten')
      .populate('loai_ngay_nghi_id', 'ten');
    if (!yeuCau) {
      return res.status(404).json({ msg: 'Không tìm thấy yêu cầu' });
    }
    res.json(yeuCau);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy yêu cầu' });
    }
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// Cập nhật trạng thái duyệt/từ chối
exports.updateYeuCauStatus = async (req, res) => {
  try {
    const {trang_thai, nguoi_duyet_id, ghi_chu_quan_ly} = req.body;
    const yeuCau = await YeuCauNghiPhep.findById(req.params.id);
    if (!yeuCau) {
      return res.status(404).json({ msg: 'Không tìm thấy yêu cầu' });
    }

    // Nếu duyệt (Da duy?t) thì tăng số ngày đã sử dụng
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
    try {
      const nv = await NhanVien.findById(yeuCau.nhan_vien_id);
      const to = nv?.lien_he?.email_cong_viec;
      if (to) {
        await sendMail({
          from: process.env.MAIL_FROM || 'no-reply@example.com',
          to,
          subject: `Yêu cầu nghỉ phép ${trang_thai}`,
          text: `Yêu cầu nghỉ phép của bạn đã được cập nhật trạng thái: ${trang_thai}.`,
        });
      }
    } catch (e) {
      // ignore mail errors
    }
    res.json(yeuCau);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// Nhân viên hủy yêu cầu
exports.cancelYeuCau = async (req, res) => {
  try {
    const yeuCau = await YeuCauNghiPhep.findById(req.params.id);
    if (!yeuCau) {
      return res.status(404).json({ msg: 'Không tìm thấy yêu cầu' });
    }
    if (yeuCau.trang_thai !== 'Cho duyet') {
      return res.status(400).json({ msg: 'Không thể hủy yêu cầu đã xử lý' });
    }
    yeuCau.trang_thai = 'Da huy';
    await yeuCau.save();
    res.json(yeuCau);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};
