const express = require('express');
const router = express.Router();
const NhanVien = require('../schemas/nhanVien.model');
const YeuCauNghiPhep = require('../schemas/yeuCauNghiPhep.model');
const Claim = require('../schemas/claim.model');
const PhongBan = require('../schemas/phongBan.model');
const ChamCong = require('../schemas/chamCong.model');

router.get('/summary', async (_req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [employees, leavePending, claimsPending, departments, attendanceToday] = await Promise.all([
      NhanVien.countDocuments({ da_xoa: false }),
      YeuCauNghiPhep.countDocuments({ trang_thai: 'Cho duyet' }),
      Claim.countDocuments({ trang_thai: 'Submitted' }),
      PhongBan.countDocuments({ da_xoa: false }),
      // Dem so nhan vien da check-in hom nay
      ChamCong.countDocuments({
        ngay: { $gte: today },
        thoi_gian_vao: { $exists: true },
      }),
    ]);

    // Tinh xu huong cham cong 7 ngay qua
    const trendPromises = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setDate(day.getDate() + 1);
      const lateThreshold = new Date(dayStart);
      lateThreshold.setHours(8, 30, 0, 0);

      trendPromises.push(
        Promise.all([
          ChamCong.countDocuments({ ngay: { $gte: dayStart, $lt: dayEnd } }),
          ChamCong.countDocuments({ ngay: { $gte: dayStart, $lt: dayEnd }, thoi_gian_vao: { $gt: lateThreshold } }),
        ]).then(([present, late]) => ({
          date: dayStart.toISOString(),
          present,
          late,
          absent: Math.max(employees - present, 0),
        })),
      );
    }
    const attendanceTrend = await Promise.all(trendPromises);

    // Phan bo loai nghi phep (da duyet)
    const distributionAgg = await YeuCauNghiPhep.aggregate([
      { $match: { trang_thai: 'Da duyet' } },
      { $group: { _id: '$loai_ngay_nghi_id', value: { $sum: 1 } } },
      {
        $lookup: {
          from: 'loai_ngay_nghi',
          localField: '_id',
          foreignField: '_id',
          as: 'loai',
        },
      },
      { $unwind: { path: '$loai', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          name: { $ifNull: ['$loai.ten', 'Khac'] },
          value: 1,
        },
      },
    ]);

    res.json({
      employees,
      leavePending,
      claimsPending,
      departments,
      attendanceToday,
      attendanceTrend,
      leaveTypesDistribution: distributionAgg,
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
});

module.exports = router;
