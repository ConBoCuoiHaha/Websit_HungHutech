const PerformanceTracker = require('../schemas/performanceTracker.model');

// Lấy danh sách trackers với filters
exports.getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      nhan_vien_id,
      nguoi_danh_gia_id,
      trang_thai,
      tu_ngay,
      den_ngay
    } = req.query;

    const query = {};

    // Filter theo nhân viên
    if (nhan_vien_id) {
      query.nhan_vien_id = nhan_vien_id;
    }

    // Filter theo người đánh giá
    if (nguoi_danh_gia_id) {
      query.nguoi_danh_gia_id = nguoi_danh_gia_id;
    }

    // Filter theo trạng thái
    if (trang_thai) {
      query.trang_thai = trang_thai;
    }

    // Filter theo kỳ đánh giá
    if (tu_ngay && den_ngay) {
      query.$or = [
        {
          'ky_danh_gia.tu_ngay': { $lte: new Date(den_ngay) },
          'ky_danh_gia.den_ngay': { $gte: new Date(tu_ngay) }
        }
      ];
    }

    // Tìm kiếm theo tên
    if (search) {
      query.ten_tracker = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await PerformanceTracker.find(query)
      .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
      .populate('nguoi_danh_gia_id', 'ma_nhan_vien ho_dem ten')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PerformanceTracker.countDocuments(query);

    res.json({
      items,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error getting performance trackers:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách tracker', error: error.message });
  }
};

// Lấy tracker theo ID
exports.getById = async (req, res) => {
  try {
    const tracker = await PerformanceTracker.findById(req.params.id)
      .populate('nhan_vien_id')
      .populate('nguoi_danh_gia_id');

    if (!tracker) {
      return res.status(404).json({ message: 'Không tìm thấy tracker' });
    }

    res.json(tracker);
  } catch (error) {
    console.error('Error getting tracker:', error);
    res.status(500).json({ message: 'Lỗi khi lấy tracker', error: error.message });
  }
};

// Tạo tracker mới
exports.create = async (req, res) => {
  try {
    const tracker = new PerformanceTracker(req.body);
    await tracker.save();

    const populated = await PerformanceTracker.findById(tracker._id)
      .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
      .populate('nguoi_danh_gia_id', 'ma_nhan_vien ho_dem ten');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating tracker:', error);
    res.status(500).json({ message: 'Lỗi khi tạo tracker', error: error.message });
  }
};

// Cập nhật tracker
exports.update = async (req, res) => {
  try {
    const tracker = await PerformanceTracker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
      .populate('nguoi_danh_gia_id', 'ma_nhan_vien ho_dem ten');

    if (!tracker) {
      return res.status(404).json({ message: 'Không tìm thấy tracker' });
    }

    res.json(tracker);
  } catch (error) {
    console.error('Error updating tracker:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật tracker', error: error.message });
  }
};

// Xóa tracker
exports.delete = async (req, res) => {
  try {
    const tracker = await PerformanceTracker.findByIdAndDelete(req.params.id);

    if (!tracker) {
      return res.status(404).json({ message: 'Không tìm thấy tracker' });
    }

    res.json({ message: 'Đã xóa tracker thành công' });
  } catch (error) {
    console.error('Error deleting tracker:', error);
    res.status(500).json({ message: 'Lỗi khi xóa tracker', error: error.message });
  }
};

// Cập nhật mục tiêu
exports.updateGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const tracker = await PerformanceTracker.findOne({ 'muc_tieu._id': goalId });

    if (!tracker) {
      return res.status(404).json({ message: 'Không tìm thấy mục tiêu' });
    }

    const goal = tracker.muc_tieu.id(goalId);
    if (!goal) {
      return res.status(404).json({ message: 'Không tìm thấy mục tiêu' });
    }

    Object.assign(goal, req.body);
    await tracker.save();

    const populated = await PerformanceTracker.findById(tracker._id)
      .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
      .populate('nguoi_danh_gia_id', 'ma_nhan_vien ho_dem ten');

    res.json(populated);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật mục tiêu', error: error.message });
  }
};

// Thêm mục tiêu mới
exports.addGoal = async (req, res) => {
  try {
    const tracker = await PerformanceTracker.findById(req.params.id);

    if (!tracker) {
      return res.status(404).json({ message: 'Không tìm thấy tracker' });
    }

    tracker.muc_tieu.push(req.body);
    await tracker.save();

    const populated = await PerformanceTracker.findById(tracker._id)
      .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
      .populate('nguoi_danh_gia_id', 'ma_nhan_vien ho_dem ten');

    res.json(populated);
  } catch (error) {
    console.error('Error adding goal:', error);
    res.status(500).json({ message: 'Lỗi khi thêm mục tiêu', error: error.message });
  }
};

// Xóa mục tiêu
exports.deleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const tracker = await PerformanceTracker.findOne({ 'muc_tieu._id': goalId });

    if (!tracker) {
      return res.status(404).json({ message: 'Không tìm thấy mục tiêu' });
    }

    tracker.muc_tieu.pull(goalId);
    await tracker.save();

    const populated = await PerformanceTracker.findById(tracker._id)
      .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
      .populate('nguoi_danh_gia_id', 'ma_nhan_vien ho_dem ten');

    res.json(populated);
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Lỗi khi xóa mục tiêu', error: error.message });
  }
};

// Cập nhật đánh giá chung
exports.updateOverallReview = async (req, res) => {
  try {
    const tracker = await PerformanceTracker.findById(req.params.id);

    if (!tracker) {
      return res.status(404).json({ message: 'Không tìm thấy tracker' });
    }

    tracker.danh_gia_chung = req.body;
    await tracker.save();

    const populated = await PerformanceTracker.findById(tracker._id)
      .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
      .populate('nguoi_danh_gia_id', 'ma_nhan_vien ho_dem ten');

    res.json(populated);
  } catch (error) {
    console.error('Error updating overall review:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật đánh giá chung', error: error.message });
  }
};

// Lấy thống kê tracker
exports.getStatistics = async (req, res) => {
  try {
    const { nhan_vien_id, tu_ngay, den_ngay } = req.query;

    const query = {};
    if (nhan_vien_id) query.nhan_vien_id = nhan_vien_id;
    if (tu_ngay && den_ngay) {
      query['ky_danh_gia.tu_ngay'] = { $lte: new Date(den_ngay) };
      query['ky_danh_gia.den_ngay'] = { $gte: new Date(tu_ngay) };
    }

    const stats = await PerformanceTracker.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          tong_tracker: { $sum: 1 },
          dang_theo_doi: {
            $sum: { $cond: [{ $eq: ['$trang_thai', 'Đang theo dõi'] }, 1, 0] }
          },
          da_hoan_thanh: {
            $sum: { $cond: [{ $eq: ['$trang_thai', 'Đã hoàn thành'] }, 1, 0] }
          },
          diem_trung_binh: { $avg: '$danh_gia_chung.diem_tong' }
        }
      }
    ]);

    res.json(stats[0] || {
      tong_tracker: 0,
      dang_theo_doi: 0,
      da_hoan_thanh: 0,
      diem_trung_binh: null
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê', error: error.message });
  }
};
