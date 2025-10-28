const Interview = require('../schemas/interview.model');
const { parseListParams, buildSort, buildSearchQuery } = require('../utils/pagination');

// Lấy tất cả lịch phỏng vấn với filter
exports.getAll = async (req, res) => {
  try {
    const { limit, skip, q, sort, page } = parseListParams(req.query);
    const filter = { da_xoa: false };

    // Filter theo ứng viên
    if (req.query.ung_vien_id) {
      filter.ung_vien_id = req.query.ung_vien_id;
    }

    // Filter theo vị trí tuyển dụng
    if (req.query.vi_tri_tuyen_dung_id) {
      filter.vi_tri_tuyen_dung_id = req.query.vi_tri_tuyen_dung_id;
    }

    // Filter theo trạng thái
    if (req.query.trang_thai) {
      filter.trang_thai = req.query.trang_thai;
    }

    // Filter theo loại phỏng vấn
    if (req.query.loai_phong_van) {
      filter.loai_phong_van = req.query.loai_phong_van;
    }

    // Filter theo ngày
    if (req.query.tu_ngay || req.query.den_ngay) {
      filter.ngay_gio = {};
      if (req.query.tu_ngay) {
        filter.ngay_gio.$gte = new Date(req.query.tu_ngay);
      }
      if (req.query.den_ngay) {
        filter.ngay_gio.$lte = new Date(req.query.den_ngay);
      }
    }

    // Filter theo người phỏng vấn
    if (req.query.nguoi_phong_van_id) {
      filter['nguoi_phong_van.nhan_vien_id'] = req.query.nguoi_phong_van_id;
    }

    const [items, total] = await Promise.all([
      Interview.find(filter)
        .populate('ung_vien_id', 'ho_ten email dien_thoai')
        .populate('vi_tri_tuyen_dung_id', 'tieu_de')
        .populate('nguoi_phong_van.nhan_vien_id', 'ho_dem ten')
        .populate('ket_qua_phong_van.y_kien_nguoi_phong_van.nhan_vien_id', 'ho_dem ten')
        .sort(buildSort(sort || '-ngay_gio'))
        .skip(skip)
        .limit(limit),
      Interview.countDocuments(filter),
    ]);

    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error in getAll interviews:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// Lấy lịch phỏng vấn theo ID
exports.getById = async (req, res) => {
  try {
    const item = await Interview.findById(req.params.id)
      .populate('ung_vien_id', 'ho_ten email dien_thoai ghi_chu')
      .populate('vi_tri_tuyen_dung_id', 'tieu_de mo_ta')
      .populate('nguoi_phong_van.nhan_vien_id', 'ho_dem ten')
      .populate('ket_qua_phong_van.y_kien_nguoi_phong_van.nhan_vien_id', 'ho_dem ten');

    if (!item || item.da_xoa) {
      return res.status(404).json({ msg: 'Không tìm thấy lịch phỏng vấn' });
    }

    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy lịch phỏng vấn' });
    }
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// Tạo lịch phỏng vấn mới
exports.create = async (req, res) => {
  try {
    const interviewData = {
      ...req.body,
      trang_thai: req.body.trang_thai || 'Đã lên lịch',
    };

    const doc = await Interview.create(interviewData);

    // Populate để trả về thông tin đầy đủ
    const populatedDoc = await Interview.findById(doc._id)
      .populate('ung_vien_id', 'ho_ten email dien_thoai')
      .populate('vi_tri_tuyen_dung_id', 'tieu_de')
      .populate('nguoi_phong_van.nhan_vien_id', 'ho_dem ten');

    // TODO: Gửi email thông báo cho ứng viên và người phỏng vấn
    // Có thể tích hợp nodemailer hoặc email service ở đây

    res.status(201).json(populatedDoc);
  } catch (err) {
    console.error('Error creating interview:', err);
    res.status(400).json({ msg: 'Không thể tạo lịch phỏng vấn', error: err.message });
  }
};

// Cập nhật lịch phỏng vấn
exports.update = async (req, res) => {
  try {
    const item = await Interview.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('ung_vien_id', 'ho_ten email dien_thoai')
      .populate('vi_tri_tuyen_dung_id', 'tieu_de')
      .populate('nguoi_phong_van.nhan_vien_id', 'ho_dem ten');

    if (!item) {
      return res.status(404).json({ msg: 'Không tìm thấy lịch phỏng vấn' });
    }

    res.json(item);
  } catch (err) {
    console.error('Error updating interview:', err);
    res.status(400).json({ msg: 'Không thể cập nhật lịch phỏng vấn', error: err.message });
  }
};

// Xóa lịch phỏng vấn (soft delete)
exports.delete = async (req, res) => {
  try {
    const item = await Interview.findByIdAndUpdate(
      req.params.id,
      { da_xoa: true },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ msg: 'Không tìm thấy lịch phỏng vấn' });
    }

    res.json({ msg: 'Lịch phỏng vấn đã được xóa thành công' });
  } catch (err) {
    console.error('Error deleting interview:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// Cập nhật kết quả phỏng vấn
exports.updateResult = async (req, res) => {
  try {
    const { ket_qua_phong_van } = req.body;

    if (!ket_qua_phong_van) {
      return res.status(400).json({ msg: 'Thiếu thông tin kết quả phỏng vấn' });
    }

    const item = await Interview.findByIdAndUpdate(
      req.params.id,
      {
        ket_qua_phong_van,
        trang_thai: 'Đã hoàn thành',
      },
      { new: true, runValidators: true }
    )
      .populate('ung_vien_id', 'ho_ten email dien_thoai')
      .populate('vi_tri_tuyen_dung_id', 'tieu_de')
      .populate('nguoi_phong_van.nhan_vien_id', 'ho_dem ten')
      .populate('ket_qua_phong_van.y_kien_nguoi_phong_van.nhan_vien_id', 'ho_dem ten');

    if (!item) {
      return res.status(404).json({ msg: 'Không tìm thấy lịch phỏng vấn' });
    }

    res.json(item);
  } catch (err) {
    console.error('Error updating interview result:', err);
    res.status(400).json({ msg: 'Không thể cập nhật kết quả phỏng vấn', error: err.message });
  }
};

// Xác nhận lịch phỏng vấn
exports.confirm = async (req, res) => {
  try {
    const item = await Interview.findByIdAndUpdate(
      req.params.id,
      { trang_thai: 'Đã xác nhận' },
      { new: true }
    )
      .populate('ung_vien_id', 'ho_ten email dien_thoai')
      .populate('vi_tri_tuyen_dung_id', 'tieu_de')
      .populate('nguoi_phong_van.nhan_vien_id', 'ho_dem ten');

    if (!item) {
      return res.status(404).json({ msg: 'Không tìm thấy lịch phỏng vấn' });
    }

    res.json(item);
  } catch (err) {
    console.error('Error confirming interview:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// Hủy lịch phỏng vấn
exports.cancel = async (req, res) => {
  try {
    const { ly_do } = req.body;

    const item = await Interview.findByIdAndUpdate(
      req.params.id,
      {
        trang_thai: 'Đã hủy',
        ghi_chu: ly_do ? `Lý do hủy: ${ly_do}. ${item?.ghi_chu || ''}` : item?.ghi_chu,
      },
      { new: true }
    )
      .populate('ung_vien_id', 'ho_ten email dien_thoai')
      .populate('vi_tri_tuyen_dung_id', 'tieu_de')
      .populate('nguoi_phong_van.nhan_vien_id', 'ho_dem ten');

    if (!item) {
      return res.status(404).json({ msg: 'Không tìm thấy lịch phỏng vấn' });
    }

    res.json(item);
  } catch (err) {
    console.error('Error canceling interview:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// Lấy lịch phỏng vấn theo ngày/tuần cho interviewer
exports.getSchedule = async (req, res) => {
  try {
    const { nguoi_phong_van_id, tu_ngay, den_ngay, view } = req.query;

    if (!nguoi_phong_van_id) {
      return res.status(400).json({ msg: 'Thiếu thông tin người phỏng vấn' });
    }

    const filter = {
      da_xoa: false,
      'nguoi_phong_van.nhan_vien_id': nguoi_phong_van_id,
      trang_thai: { $nin: ['Đã hủy'] },
    };

    // Xác định khoảng thời gian
    if (tu_ngay && den_ngay) {
      filter.ngay_gio = {
        $gte: new Date(tu_ngay),
        $lte: new Date(den_ngay),
      };
    } else if (view === 'week') {
      // Lấy lịch 7 ngày tới
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      filter.ngay_gio = { $gte: now, $lte: nextWeek };
    } else if (view === 'month') {
      // Lấy lịch tháng hiện tại
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filter.ngay_gio = { $gte: startOfMonth, $lte: endOfMonth };
    } else {
      // Mặc định lấy lịch từ hôm nay trở đi
      filter.ngay_gio = { $gte: new Date() };
    }

    const items = await Interview.find(filter)
      .populate('ung_vien_id', 'ho_ten email dien_thoai')
      .populate('vi_tri_tuyen_dung_id', 'tieu_de')
      .populate('nguoi_phong_van.nhan_vien_id', 'ho_dem ten')
      .sort('ngay_gio');

    res.json({ items, total: items.length });
  } catch (err) {
    console.error('Error getting interview schedule:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};
