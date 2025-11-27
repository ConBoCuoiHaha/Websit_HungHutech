/**
 * Bổ sung chấm công 15 ngày gần nhất cho các nhân viên NV201 - NV210 (không xóa dữ liệu cũ).
 * - Nếu đã có bản ghi cùng ngày cho nhân viên thì bỏ qua.
 * - Mô phỏng: đúng giờ, đi muộn nhẹ, đi muộn nặng, nghỉ (không tạo bản ghi) xen kẽ.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const ChamCong = require('../schemas/chamCong.model');
const NhanVien = require('../schemas/nhanVien.model');

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGODB_ATLAS_URI ||
  'mongodb://localhost:27017/HungHutech';

const SHIFT_SNAPSHOT = {
  ten_ca: 'Ca hành chính',
  gio_bat_dau: '08:30',
  gio_ket_thuc: '17:30',
};

const startOfDay = (d) => {
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  return dd;
};

async function seed() {
  await mongoose.connect(MONGO_URI, { maxPoolSize: 10 });
  console.log('Connected to MongoDB');

  const codes = Array.from({ length: 10 }, (_, i) => `NV${201 + i}`);
  const employees = await NhanVien.find({ ma_nhan_vien: { $in: codes } })
    .select('_id ma_nhan_vien')
    .lean();
  const empMap = new Map(employees.map((e) => [e.ma_nhan_vien, e._id]));

  let created = 0;
  const patterns = [];
  // 15 ngày gần nhất (0 = hôm nay)
  for (let i = 0; i < 15; i += 1) {
    // xoay vòng: on-time, late 10, late 45, nghỉ
    const mod = i % 4;
    if (mod === 3) {
      patterns.push({ dayOffset: i, lateMinutes: null }); // nghỉ: không tạo
    } else if (mod === 2) {
      patterns.push({ dayOffset: i, lateMinutes: 45 });
    } else if (mod === 1) {
      patterns.push({ dayOffset: i, lateMinutes: 10 });
    } else {
      patterns.push({ dayOffset: i, lateMinutes: 0 });
    }
  }

  for (const [code, _id] of empMap) {
    for (const ptn of patterns) {
      if (ptn.lateMinutes === null) continue; // nghỉ
      const ngay = startOfDay(new Date(Date.now() - ptn.dayOffset * 86400000));

      const existed = await ChamCong.findOne({ nhan_vien_id: _id, ngay }).lean();
      if (existed) continue;

      const checkIn = new Date(ngay);
      checkIn.setHours(8, 30 + ptn.lateMinutes, 0, 0);
      const checkOut = new Date(ngay);
      checkOut.setHours(17, 30, 0, 0);

      const flags = {
        isLate: ptn.lateMinutes > 0,
        lateOver30: ptn.lateMinutes > 30,
        lateMinutes: ptn.lateMinutes,
        shiftStart: new Date(ngay.getTime() + 8.5 * 3600000),
        earliestCheckIn: new Date(ngay.getTime() + 8 * 3600000),
      };

      await ChamCong.create({
        nhan_vien_id: _id,
        ca_lam_viec_id: null,
        thoi_gian_vao: checkIn,
        thoi_gian_ra: checkOut,
        ngay,
        ghi_chu:
          ptn.lateMinutes === 0
            ? 'Đúng giờ (seed 15d)'
            : `Đi muộn ${ptn.lateMinutes} phút (seed 15d)`,
        shift_snapshot: SHIFT_SNAPSHOT,
        flags,
      });
      created += 1;
    }
  }

  console.log(`Đã tạo thêm ${created} bản ghi chấm công (không đụng dữ liệu cũ).`);
  await mongoose.disconnect();
}

seed()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
