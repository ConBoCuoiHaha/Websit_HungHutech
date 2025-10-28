require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../schemas/user.model');
const NhanVien = require('../schemas/nhanVien.model');
const ChucDanh = require('../schemas/chucDanh.model');
const PhongBan = require('../schemas/phongBan.model');
const DiaDiem = require('../schemas/diaDiem.model');
const TrangThaiLaoDong = require('../schemas/trangThaiLaoDong.model');
const LoaiNgayNghi = require('../schemas/loaiNgayNghi.model');

async function seedDatabase() {
  try {
    console.log('🔄 Đang kết nối tới MongoDB...');
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Hung-qlns';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối thành công!\n');

    // Xóa dữ liệu cũ (nếu có)
    console.log('🗑️  Xóa dữ liệu cũ...');
    await Promise.all([
      User.deleteMany({}),
      NhanVien.deleteMany({}),
      ChucDanh.deleteMany({}),
      PhongBan.deleteMany({}),
      DiaDiem.deleteMany({}),
      TrangThaiLaoDong.deleteMany({}),
      LoaiNgayNghi.deleteMany({}),
    ]);
    console.log('✅ Đã xóa dữ liệu cũ\n');

    // 1. Tạo Chức danh
    console.log('📝 Tạo Chức danh...');
    const chucDanhs = await ChucDanh.insertMany([
      { ten_chuc_danh: 'Giám đốc', mo_ta: 'Giám đốc điều hành công ty' },
      { ten_chuc_danh: 'Trưởng phòng', mo_ta: 'Quản lý phòng ban' },
      { ten_chuc_danh: 'Nhân viên', mo_ta: 'Nhân viên thực thi' },
      { ten_chuc_danh: 'Thực tập sinh', mo_ta: 'Sinh viên thực tập' },
      { ten_chuc_danh: 'Chuyên viên', mo_ta: 'Chuyên viên có kinh nghiệm' },
    ]);
    console.log(`✅ Đã tạo ${chucDanhs.length} chức danh\n`);

    // 2. Tạo Địa điểm
    console.log('📍 Tạo Địa điểm...');
    const diaDiems = await DiaDiem.insertMany([
      { ten: 'Trụ sở chính', thanh_pho: 'Hà Nội', quoc_gia: 'Việt Nam', dia_chi: 'Số 1 Đường Láng' },
      { ten: 'Chi nhánh TP.HCM', thanh_pho: 'TP. Hồ Chí Minh', quoc_gia: 'Việt Nam', dia_chi: 'Số 123 Nguyễn Huệ' },
      { ten: 'Chi nhánh Đà Nẵng', thanh_pho: 'Đà Nẵng', quoc_gia: 'Việt Nam', dia_chi: 'Số 456 Trần Phú' },
    ]);
    console.log(`✅ Đã tạo ${diaDiems.length} địa điểm\n`);

    // 3. Tạo Trạng thái lao động
    console.log('📊 Tạo Trạng thái lao động...');
    const trangThais = await TrangThaiLaoDong.insertMany([
      { ten: 'Toàn thời gian', mo_ta: 'Nhân viên làm việc toàn thời gian' },
      { ten: 'Bán thời gian', mo_ta: 'Nhân viên làm việc bán thời gian' },
      { ten: 'Hợp đồng', mo_ta: 'Nhân viên hợp đồng có thời hạn' },
      { ten: 'Thực tập', mo_ta: 'Sinh viên thực tập' },
    ]);
    console.log(`✅ Đã tạo ${trangThais.length} trạng thái lao động\n`);

    // 4. Tạo Phòng ban
    console.log('🏢 Tạo Phòng ban...');
    const phongBans = await PhongBan.insertMany([
      { ten: 'Ban Giám đốc', mo_ta: 'Ban lãnh đạo công ty' },
      { ten: 'Phòng Nhân sự', mo_ta: 'Quản lý nguồn nhân lực' },
      { ten: 'Phòng Kỹ thuật', mo_ta: 'Phát triển sản phẩm và công nghệ' },
      { ten: 'Phòng Kinh doanh', mo_ta: 'Bán hàng và chăm sóc khách hàng' },
      { ten: 'Phòng Kế toán', mo_ta: 'Quản lý tài chính công ty' },
    ]);
    console.log(`✅ Đã tạo ${phongBans.length} phòng ban\n`);

    // 5. Tạo Loại ngày nghỉ
    console.log('🏖️  Tạo Loại ngày nghỉ...');
    const loaiNgayNghis = await LoaiNgayNghi.insertMany([
      { ten: 'Nghỉ phép năm', so_ngay_mac_dinh: 12, co_luong: true, mo_ta: 'Nghỉ phép được hưởng lương' },
      { ten: 'Nghỉ ốm', so_ngay_mac_dinh: 30, co_luong: true, mo_ta: 'Nghỉ ốm có xác nhận y tế' },
      { ten: 'Nghỉ không lương', so_ngay_mac_dinh: 0, co_luong: false, mo_ta: 'Nghỉ không h향ưởng lương' },
      { ten: 'Nghỉ thai sản', so_ngay_mac_dinh: 180, co_luong: true, mo_ta: 'Nghỉ sinh con' },
    ]);
    console.log(`✅ Đã tạo ${loaiNgayNghis.length} loại ngày nghỉ\n`);

    // 6. Tạo Nhân viên
    console.log('👥 Tạo Nhân viên...');
    const nhanViens = await NhanVien.insertMany([
      {
        ma_nhan_vien: 'NV001',
        ho_dem: 'Nguyễn Văn',
        ten: 'An',
        ngay_sinh: new Date('1990-01-15'),
        gioi_tinh: 'Nam',
        lien_he: {
          email_cong_viec: 'an.nguyen@company.com',
          di_dong: '0901234567',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2020-01-01'),
          chuc_danh_id: chucDanhs[0]._id,
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[0]._id,
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },
      {
        ma_nhan_vien: 'NV002',
        ho_dem: 'Trần Thị',
        ten: 'Bình',
        ngay_sinh: new Date('1992-05-20'),
        gioi_tinh: 'Nữ',
        lien_he: {
          email_cong_viec: 'binh.tran@company.com',
          di_dong: '0912345678',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2021-03-15'),
          chuc_danh_id: chucDanhs[1]._id,
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[1]._id,
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },
      {
        ma_nhan_vien: 'NV003',
        ho_dem: 'Lê Văn',
        ten: 'Cường',
        ngay_sinh: new Date('1995-08-10'),
        gioi_tinh: 'Nam',
        lien_he: {
          email_cong_viec: 'cuong.le@company.com',
          di_dong: '0923456789',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2022-06-01'),
          chuc_danh_id: chucDanhs[2]._id,
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[2]._id,
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },
      {
        ma_nhan_vien: 'NV004',
        ho_dem: 'Phạm Thị',
        ten: 'Dung',
        ngay_sinh: new Date('1998-12-25'),
        gioi_tinh: 'Nữ',
        lien_he: {
          email_cong_viec: 'dung.pham@company.com',
          di_dong: '0934567890',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2023-01-10'),
          chuc_danh_id: chucDanhs[2]._id,
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[3]._id,
          dia_diem_lam_viec_ids: [diaDiems[1]._id],
        },
      },
      {
        ma_nhan_vien: 'NV005',
        ho_dem: 'Hoàng Văn',
        ten: 'Em',
        ngay_sinh: new Date('2000-03-15'),
        gioi_tinh: 'Nam',
        lien_he: {
          email_cong_viec: 'em.hoang@company.com',
          di_dong: '0945678901',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2023-09-01'),
          chuc_danh_id: chucDanhs[3]._id,
          trang_thai_lao_dong_id: trangThais[3]._id,
          phong_ban_id: phongBans[2]._id,
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },
    ]);
    console.log(`✅ Đã tạo ${nhanViens.length} nhân viên\n`);

    // 7. Tạo Users (tài khoản đăng nhập)
    console.log('🔐 Tạo Users...');
    const password = await bcrypt.hash('123456', 10);
    const users = await User.insertMany([
      {
        email: 'admin@company.com',
        password_hash: password,
        role: 'admin',
        nhan_vien_id: nhanViens[0]._id,
      },
      {
        email: 'manager@company.com',
        password_hash: password,
        role: 'manager',
        nhan_vien_id: nhanViens[1]._id,
      },
      {
        email: 'employee@company.com',
        password_hash: password,
        role: 'employee',
        nhan_vien_id: nhanViens[2]._id,
      },
    ]);
    console.log(`✅ Đã tạo ${users.length} users\n`);

    // Hiển thị thông tin đăng nhập
    console.log('═══════════════════════════════════════════');
    console.log('🎉 KHỞI TẠO DATABASE THÀNH CÔNG!');
    console.log('═══════════════════════════════════════════');
    console.log('\n📋 THÔNG TIN ĐĂNG NHẬP:');
    console.log('─────────────────────────────────────────');
    console.log('👤 Admin:');
    console.log('   Email: admin@company.com');
    console.log('   Password: 123456');
    console.log('');
    console.log('👤 Manager:');
    console.log('   Email: manager@company.com');
    console.log('   Password: 123456');
    console.log('');
    console.log('👤 Employee:');
    console.log('   Email: employee@company.com');
    console.log('   Password: 123456');
    console.log('═══════════════════════════════════════════\n');

    console.log('📊 TỔNG KẾT:');
    console.log(`   ✅ ${chucDanhs.length} chức danh`);
    console.log(`   ✅ ${diaDiems.length} địa điểm`);
    console.log(`   ✅ ${trangThais.length} trạng thái lao động`);
    console.log(`   ✅ ${phongBans.length} phòng ban`);
    console.log(`   ✅ ${loaiNgayNghis.length} loại ngày nghỉ`);
    console.log(`   ✅ ${nhanViens.length} nhân viên`);
    console.log(`   ✅ ${users.length} users`);
    console.log('\n✅ Hoàn tất!\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

seedDatabase();
