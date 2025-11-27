/**
 * Seed thêm 10 nhân viên + tài khoản đăng nhập + dữ liệu chấm công mẫu.
 * Lưu ý: KHÔNG xóa dữ liệu hiện tại. Script chỉ thêm mới nếu email/ma_nhan_vien chưa tồn tại.
 * Mật khẩu mặc định: 123456
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const NhanVien = require('../schemas/nhanVien.model');
const User = require('../schemas/user.model');
const ChamCong = require('../schemas/chamCong.model');

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGODB_ATLAS_URI ||
  'mongodb://localhost:27017/HungHutech';

const SHIFT_SNAPSHOT = {
  ten_ca: 'Ca hành chính',
  gio_bat_dau: '08:30',
  gio_ket_thuc: '17:30',
};

const today = new Date();
const startOfDay = (d) => {
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  return dd;
};

const sampleEmployees = [
  { code: 'NV201', name: 'An', last: 'Trần Minh', email: 'an.tran@demo-hutech.vn', phone: '0911000001' },
  { code: 'NV202', name: 'Bình', last: 'Nguyễn Thị', email: 'binh.nguyen@demo-hutech.vn', phone: '0911000002' },
  { code: 'NV203', name: 'Châu', last: 'Lê Hoàng', email: 'chau.le@demo-hutech.vn', phone: '0911000003' },
  { code: 'NV204', name: 'Duy', last: 'Phạm Nhật', email: 'duy.pham@demo-hutech.vn', phone: '0911000004' },
  { code: 'NV205', name: 'Giang', last: 'Vũ Thị', email: 'giang.vu@demo-hutech.vn', phone: '0911000005' },
  { code: 'NV206', name: 'Hà', last: 'Đỗ Quang', email: 'ha.do@demo-hutech.vn', phone: '0911000006' },
  { code: 'NV207', name: 'Khánh', last: 'Bùi Anh', email: 'khanh.bui@demo-hutech.vn', phone: '0911000007' },
  { code: 'NV208', name: 'Lan', last: 'Trịnh Mai', email: 'lan.trinh@demo-hutech.vn', phone: '0911000008' },
  { code: 'NV209', name: 'Minh', last: 'Hoàng Gia', email: 'minh.hoang@demo-hutech.vn', phone: '0911000009' },
  { code: 'NV210', name: 'Nam', last: 'Phan Hữu', email: 'nam.phan@demo-hutech.vn', phone: '0911000010' },
];

async function seed() {
  await mongoose.connect(MONGO_URI, { maxPoolSize: 10 });
  console.log('Connected to MongoDB');

  const passwordHash = await bcrypt.hash('123456', 10);
  let created = 0;
  const attendanceCreated = [];

  for (const emp of sampleEmployees) {
    const existsUser = await User.findOne({ email: emp.email }).lean();
    if (existsUser) {
      console.log(`Skip ${emp.email} (đã tồn tại)`);
      continue;
    }

    const nhanVien = await NhanVien.create({
      ma_nhan_vien: emp.code,
      ho_dem: emp.last,
      ten: emp.name,
      gioi_tinh: 'Khác',
      ngay_sinh: new Date('1995-01-15'),
      lien_he: {
        di_dong: emp.phone,
        email_cong_viec: emp.email,
      },
      thong_tin_cong_viec: {
        ngay_vao_lam: new Date('2024-01-02'),
        chuc_danh_id: null,
        trang_thai_lao_dong_id: null,
        phong_ban_id: null,
        dia_diem_lam_viec_ids: [],
        quan_ly_truc_tiep_ids: [],
      },
    });

    await User.create({
      email: emp.email,
      password_hash: passwordHash,
      role: 'employee',
      nhan_vien_id: nhanVien._id,
      active: true,
    });

    // Tạo chấm công 5 ngày gần đây: on-time, trễ nhẹ, nghỉ (không record), trễ nặng, on-time
    const patterns = [
      { lateMinutes: 0 },
      { lateMinutes: 12 },
      { lateMinutes: null }, // không chấm công (bỏ qua)
      { lateMinutes: 45 },
      { lateMinutes: 0 },
    ];

    let dayOffset = 0;
    for (const ptn of patterns) {
      const ngay = startOfDay(new Date(today.getTime() - dayOffset * 86400000));
      dayOffset += 1;
      if (ptn.lateMinutes === null) continue; // không chấm công

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

      // Nếu đã tồn tại bản ghi thì bỏ qua để không đụng unique index.
      const existed = await ChamCong.findOne({
        nhan_vien_id: nhanVien._id,
        ngay,
      }).lean();
      if (existed) continue;

      await ChamCong.create({
        nhan_vien_id: nhanVien._id,
        ca_lam_viec_id: null,
        thoi_gian_vao: checkIn,
        thoi_gian_ra: checkOut,
        ngay,
        ghi_chu: ptn.lateMinutes === 0 ? 'Đúng giờ (seed)' : `Đi muộn ${ptn.lateMinutes} phút (seed)`,
        shift_snapshot: SHIFT_SNAPSHOT,
        flags,
      });
      attendanceCreated.push(`${emp.code}-${ngay.toISOString().slice(0, 10)}`);
    }

    created += 1;
    console.log(`Đã tạo: ${emp.code} / ${emp.email}`);
  }

  console.log(`Hoàn tất. Tạo mới ${created} nhân viên + user.`);
  console.log(`Chấm công thêm: ${attendanceCreated.length} bản ghi.`);
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
