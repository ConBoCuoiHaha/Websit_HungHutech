/**
 * Bổ sung hồ sơ chi tiết cho 10 nhân viên NV201-NV210 đã seed trước đó.
 * - Không xóa dữ liệu hiện có: chỉ cập nhật nếu tìm thấy theo ma_nhan_vien.
 * - Thiết lập thông tin liên hệ, giấy tờ, bảo hiểm, học vấn, kỹ năng, kinh nghiệm, người phụ thuộc.
 * - Gán quản lý trực tiếp là user có role 'manager' (nếu có), fallback admin đầu tiên.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const NhanVien = require('../schemas/nhanVien.model');
const User = require('../schemas/user.model');

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGODB_ATLAS_URI ||
  'mongodb://localhost:27017/HungHutech';

const managerIdsCache = { manager: null, admin: null };

async function getManagerId() {
  if (managerIdsCache.manager) return managerIdsCache.manager;
  const managerUser = await User.findOne({ role: 'manager', nhan_vien_id: { $ne: null } })
    .select('nhan_vien_id')
    .lean();
  if (managerUser) {
    managerIdsCache.manager = managerUser.nhan_vien_id;
    return managerUser.nhan_vien_id;
  }
  const adminUser = await User.findOne({ role: 'admin', nhan_vien_id: { $ne: null } })
    .select('nhan_vien_id')
    .lean();
  if (adminUser) {
    managerIdsCache.admin = adminUser.nhan_vien_id;
    return adminUser.nhan_vien_id;
  }
  return null;
}

const profiles = [
  {
    code: 'NV201',
    gender: 'Nam',
    dob: '1995-03-12',
    phone: '0911000001',
    id: '079201001001',
    dep: 1,
    city: 'TP. Hồ Chí Minh',
    ward: 'Phú Nhuận',
    address: '12 Nguyễn Văn Trỗi, Phú Nhuận',
    insurance: { bhxh: 'BHXH201', bhyt: 'BHYT201' },
    position: 'Nhân viên Kỹ thuật',
  },
  {
    code: 'NV202',
    gender: 'Nữ',
    dob: '1996-05-21',
    phone: '0911000002',
    id: '079201001002',
    dep: 0,
    city: 'TP. Hồ Chí Minh',
    ward: 'Bình Thạnh',
    address: '45 D2, Bình Thạnh',
    insurance: { bhxh: 'BHXH202', bhyt: 'BHYT202' },
    position: 'Chuyên viên Marketing',
  },
  {
    code: 'NV203',
    gender: 'Nam',
    dob: '1994-08-09',
    phone: '0911000003',
    id: '079201001003',
    dep: 2,
    city: 'Hà Nội',
    ward: 'Cầu Giấy',
    address: '18 Trần Thái Tông, Cầu Giấy',
    insurance: { bhxh: 'BHXH203', bhyt: 'BHYT203' },
    position: 'Nhân viên Dự án',
  },
  {
    code: 'NV204',
    gender: 'Nam',
    dob: '1993-11-01',
    phone: '0911000004',
    id: '079201001004',
    dep: 1,
    city: 'Hà Nội',
    ward: 'Hoàng Mai',
    address: '25 Tân Mai, Hoàng Mai',
    insurance: { bhxh: 'BHXH204', bhyt: 'BHYT204' },
    position: 'Nhân viên QC',
  },
  {
    code: 'NV205',
    gender: 'Nữ',
    dob: '1997-02-15',
    phone: '0911000005',
    id: '079201001005',
    dep: 0,
    city: 'Đà Nẵng',
    ward: 'Hải Châu',
    address: '88 Bạch Đằng, Hải Châu',
    insurance: { bhxh: 'BHXH205', bhyt: 'BHYT205' },
    position: 'Kế toán viên',
  },
  {
    code: 'NV206',
    gender: 'Nam',
    dob: '1992-07-19',
    phone: '0911000006',
    id: '079201001006',
    dep: 0,
    city: 'TP. Hồ Chí Minh',
    ward: 'Quận 3',
    address: '102 Cách Mạng Tháng 8, Q3',
    insurance: { bhxh: 'BHXH206', bhyt: 'BHYT206' },
    position: 'Chuyên viên Pháp chế',
  },
  {
    code: 'NV207',
    gender: 'Nam',
    dob: '1998-09-23',
    phone: '0911000007',
    id: '079201001007',
    dep: 0,
    city: 'Hải Phòng',
    ward: 'Lê Chân',
    address: '15 Trần Nguyên Hãn, Lê Chân',
    insurance: { bhxh: 'BHXH207', bhyt: 'BHYT207' },
    position: 'Nhân viên Kho',
  },
  {
    code: 'NV208',
    gender: 'Nữ',
    dob: '1994-12-30',
    phone: '0911000008',
    id: '079201001008',
    dep: 1,
    city: 'Cần Thơ',
    ward: 'Ninh Kiều',
    address: '120 30/4, Ninh Kiều',
    insurance: { bhxh: 'BHXH208', bhyt: 'BHYT208' },
    position: 'Nhân viên CSKH',
  },
  {
    code: 'NV209',
    gender: 'Nam',
    dob: '1990-10-10',
    phone: '0911000009',
    id: '079201001009',
    dep: 2,
    city: 'TP. Hồ Chí Minh',
    ward: 'Thủ Đức',
    address: '200 Võ Văn Ngân, Thủ Đức',
    insurance: { bhxh: 'BHXH209', bhyt: 'BHYT209' },
    position: 'Kỹ sư triển khai',
  },
  {
    code: 'NV210',
    gender: 'Nam',
    dob: '1991-04-04',
    phone: '0911000010',
    id: '079201001010',
    dep: 0,
    city: 'TP. Hồ Chí Minh',
    ward: 'Bình Tân',
    address: '50 Kinh Dương Vương, Bình Tân',
    insurance: { bhxh: 'BHXH210', bhyt: 'BHYT210' },
    position: 'Nhân viên Mua hàng',
  },
];

async function run() {
  await mongoose.connect(MONGO_URI, { maxPoolSize: 10 });
  console.log('Connected to MongoDB');

  const managerId = await getManagerId();
  if (!managerId) {
    console.warn('Không tìm thấy quản lý/ admin để gán báo cáo. Bỏ qua quan_ly_truc_tiep_ids.');
  }

  let updated = 0;
  for (const info of profiles) {
    const nv = await NhanVien.findOne({ ma_nhan_vien: info.code });
    if (!nv) {
      console.log(`Skip ${info.code} (chưa tồn tại)`);
      continue;
    }

    nv.gioi_tinh = info.gender;
    nv.ngay_sinh = new Date(info.dob);
    nv.lien_he = nv.lien_he || {};
    nv.lien_he.di_dong = info.phone;
    nv.lien_he.email_cong_viec = nv.lien_he.email_cong_viec || `${info.code.toLowerCase()}@demo-hutech.vn`;
    nv.lien_he.dia_chi = info.address;
    nv.lien_he.thanh_pho = info.city;
    nv.lien_he.huyen = info.ward;

    nv.giay_to_tu_than = {
      so_cmnd_cccd: info.id,
      noi_cap: info.city,
      ngay_cap: new Date('2015-01-01'),
      so_ho_chieu: '',
    };

    nv.bao_hiem = {
      so_bhxh: info.insurance.bhxh,
      so_bhyt: info.insurance.bhyt,
      muc_luong_bhxh: 7000000,
      muc_luong_bhyt: 7000000,
      ti_le_bhxh_nv: 0.08,
      ti_le_bhxh_dn: 0.18,
      ti_le_bhyt_nv: 0.015,
      ti_le_bhyt_dn: 0.03,
      ti_le_bhtn_nv: 0.01,
      ti_le_bhtn_dn: 0.01,
    };

    nv.nguoi_phu_thuoc = [];
    for (let i = 0; i < info.dep; i++) {
      nv.nguoi_phu_thuoc.push({
        ten: `Phụ thuộc ${i + 1} ${info.code}`,
        moi_quan_he: 'Con',
        ngay_sinh: new Date('2020-01-01'),
      });
    }

    nv.hoc_van = [
      {
        truong: 'Đại học Công nghệ',
        bang_cap: 'Đại học',
        chuyen_nganh: 'CNTT/Quản trị',
        nam_bat_dau: 2012,
        nam_ket_thuc: 2016,
        diem_gpa: '3.0',
      },
    ];

    nv.ky_nang = [
      { ten_ky_nang: 'Tin học văn phòng', trinh_do: 'Khá', nam_kinh_nghiem: 3 },
      { ten_ky_nang: 'Tiếng Anh', trinh_do: 'B1', nam_kinh_nghiem: 2 },
    ];

    nv.ngoai_ngu = [
      { ngon_ngu: 'Tiếng Anh', trinh_do: 'B1', chung_chi: 'TOEIC', diem_so: '650' },
    ];

    nv.kinh_nghiem_lam_viec = [
      {
        cong_ty: 'Công ty A',
        chuc_danh: info.position,
        ngay_bat_dau: new Date('2020-01-01'),
        ngay_ket_thuc: new Date('2023-12-31'),
        mo_ta: 'Thực hiện công việc chuyên môn và phối hợp nhóm.',
      },
    ];

    nv.thong_tin_cong_viec = nv.thong_tin_cong_viec || {};
    nv.thong_tin_cong_viec.ngay_vao_lam = nv.thong_tin_cong_viec.ngay_vao_lam || new Date('2024-01-02');
    nv.thong_tin_cong_viec.chuc_danh_id = nv.thong_tin_cong_viec.chuc_danh_id || null;
    nv.thong_tin_cong_viec.trang_thai_lao_dong_id = nv.thong_tin_cong_viec.trang_thai_lao_dong_id || null;
    nv.thong_tin_cong_viec.phong_ban_id = nv.thong_tin_cong_viec.phong_ban_id || null;
    nv.thong_tin_cong_viec.dia_diem_lam_viec_ids = nv.thong_tin_cong_viec.dia_diem_lam_viec_ids || [];
    nv.thong_tin_cong_viec.quan_ly_truc_tiep_ids = managerId
      ? [managerId]
      : nv.thong_tin_cong_viec.quan_ly_truc_tiep_ids || [];

    await nv.save();
    updated += 1;
    console.log(`Updated hồ sơ ${info.code}`);
  }

  console.log(`Hoàn tất cập nhật ${updated} nhân viên.`);
  await mongoose.disconnect();
}

run()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
