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
const BacLuong = require('../schemas/bacLuong.model');
const NgayLe = require('../schemas/ngayLe.model');
const EmploymentStatus = require('../schemas/employmentStatus.model');
const JobCategory = require('../schemas/jobCategory.model');
const Nationality = require('../schemas/nationality.model');
const Skill = require('../schemas/skill.model');
const EducationLevel = require('../schemas/educationLevel.model');
const Language = require('../schemas/language.model');
const Project = require('../schemas/project.model');
const Activity = require('../schemas/activity.model');

async function seedDatabase() {
  try {
    console.log('🔄 Đang kết nối tới MongoDB...');
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Hung-qlns';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối thành công!\n');

    // Xóa dữ liệu cũ
    console.log('🗑️  Xóa dữ liệu cũ...');
    await Promise.all([
      User.deleteMany({}),
      NhanVien.deleteMany({}),
      ChucDanh.deleteMany({}),
      PhongBan.deleteMany({}),
      DiaDiem.deleteMany({}),
      TrangThaiLaoDong.deleteMany({}),
      LoaiNgayNghi.deleteMany({}),
      BacLuong.deleteMany({}),
      NgayLe.deleteMany({}),
      EmploymentStatus.deleteMany({}),
      JobCategory.deleteMany({}),
      Nationality.deleteMany({}),
      Skill.deleteMany({}),
      EducationLevel.deleteMany({}),
      Language.deleteMany({}),
      Project.deleteMany({}),
      Activity.deleteMany({}),
    ]);
    console.log('✅ Đã xóa dữ liệu cũ\n');

    // === ADMIN CONFIGURATIONS ===

    // Employment Status
    console.log('📊 Tạo Employment Status...');
    const employmentStatuses = await EmploymentStatus.insertMany([
      { ten_trang_thai: 'Toàn thời gian', mo_ta: 'Nhân viên làm việc toàn thời gian', thu_tu_sap_xep: 1, kich_hoat: true },
      { ten_trang_thai: 'Bán thời gian', mo_ta: 'Nhân viên làm việc bán thời gian', thu_tu_sap_xep: 2, kich_hoat: true },
      { ten_trang_thai: 'Hợp đồng', mo_ta: 'Nhân viên hợp đồng có thời hạn', thu_tu_sap_xep: 3, kich_hoat: true },
      { ten_trang_thai: 'Thực tập', mo_ta: 'Sinh viên thực tập', thu_tu_sap_xep: 4, kich_hoat: true },
      { ten_trang_thai: 'Thử việc', mo_ta: 'Nhân viên đang thử việc', thu_tu_sap_xep: 5, kich_hoat: true },
    ]);
    console.log(`✅ Đã tạo ${employmentStatuses.length} employment statuses\n`);

    // Job Categories
    console.log('📁 Tạo Job Categories...');
    const jobCategories = await JobCategory.insertMany([
      { ten_danh_muc: 'Công nghệ thông tin', mo_ta: 'Các vị trí liên quan đến IT', kich_hoat: true },
      { ten_danh_muc: 'Kế toán - Tài chính', mo_ta: 'Các vị trí kế toán, tài chính', kich_hoat: true },
      { ten_danh_muc: 'Nhân sự', mo_ta: 'Các vị trí quản lý nhân sự', kich_hoat: true },
      { ten_danh_muc: 'Kinh doanh - Bán hàng', mo_ta: 'Các vị trí kinh doanh', kich_hoat: true },
      { ten_danh_muc: 'Marketing', mo_ta: 'Các vị trí marketing', kich_hoat: true },
      { ten_danh_muc: 'Hành chính', mo_ta: 'Các vị trí hành chính văn phòng', kich_hoat: true },
    ]);
    console.log(`✅ Đã tạo ${jobCategories.length} job categories\n`);

    // Nationalities
    console.log('🌍 Tạo Nationalities...');
    const nationalities = await Nationality.insertMany([
      { ten_quoc_tich: 'Việt Nam', ma_quoc_gia: 'VN', kich_hoat: true },
      { ten_quoc_tich: 'Hoa Kỳ', ma_quoc_gia: 'US', kich_hoat: true },
      { ten_quoc_tich: 'Nhật Bản', ma_quoc_gia: 'JP', kich_hoat: true },
      { ten_quoc_tich: 'Hàn Quốc', ma_quoc_gia: 'KR', kich_hoat: true },
      { ten_quoc_tich: 'Trung Quốc', ma_quoc_gia: 'CN', kich_hoat: true },
      { ten_quoc_tich: 'Singapore', ma_quoc_gia: 'SG', kich_hoat: true },
    ]);
    console.log(`✅ Đã tạo ${nationalities.length} nationalities\n`);

    // Skills
    console.log('🎯 Tạo Skills...');
    const skills = await Skill.insertMany([
      { ten_ky_nang: 'JavaScript', loai_ky_nang: 'Kỹ thuật', mo_ta: 'Lập trình JavaScript', kich_hoat: true },
      { ten_ky_nang: 'Python', loai_ky_nang: 'Kỹ thuật', mo_ta: 'Lập trình Python', kich_hoat: true },
      { ten_ky_nang: 'Java', loai_ky_nang: 'Kỹ thuật', mo_ta: 'Lập trình Java', kich_hoat: true },
      { ten_ky_nang: 'Project Management', loai_ky_nang: 'Quản lý', mo_ta: 'Quản lý dự án', kich_hoat: true },
      { ten_ky_nang: 'Team Leadership', loai_ky_nang: 'Quản lý', mo_ta: 'Lãnh đạo nhóm', kich_hoat: true },
      { ten_ky_nang: 'Giao tiếp', loai_ky_nang: 'Giao tiếp', mo_ta: 'Kỹ năng giao tiếp', kich_hoat: true },
      { ten_ky_nang: 'Thuyết trình', loai_ky_nang: 'Giao tiếp', mo_ta: 'Kỹ năng thuyết trình', kich_hoat: true },
      { ten_ky_nang: 'Tiếng Anh', loai_ky_nang: 'Ngoại ngữ', mo_ta: 'Tiếng Anh giao tiếp', kich_hoat: true },
      { ten_ky_nang: 'Tiếng Nhật', loai_ky_nang: 'Ngoại ngữ', mo_ta: 'Tiếng Nhật giao tiếp', kich_hoat: true },
    ]);
    console.log(`✅ Đã tạo ${skills.length} skills\n`);

    // Education Levels
    console.log('🎓 Tạo Education Levels...');
    const educationLevels = await EducationLevel.insertMany([
      { ten_trinh_do: 'THPT', cap_do: 1, mo_ta: 'Tốt nghiệp trung học phổ thông', kich_hoat: true },
      { ten_trinh_do: 'Trung cấp', cap_do: 2, mo_ta: 'Tốt nghiệp trung cấp', kich_hoat: true },
      { ten_trinh_do: 'Cao đẳng', cap_do: 3, mo_ta: 'Tốt nghiệp cao đẳng', kich_hoat: true },
      { ten_trinh_do: 'Đại học', cap_do: 4, mo_ta: 'Tốt nghiệp đại học', kich_hoat: true },
      { ten_trinh_do: 'Thạc sĩ', cap_do: 5, mo_ta: 'Tốt nghiệp thạc sĩ', kich_hoat: true },
      { ten_trinh_do: 'Tiến sĩ', cap_do: 6, mo_ta: 'Tốt nghiệp tiến sĩ', kich_hoat: true },
    ]);
    console.log(`✅ Đã tạo ${educationLevels.length} education levels\n`);

    // Languages
    console.log('🗣️  Tạo Languages...');
    const languages = await Language.insertMany([
      { ten_ngon_ngu: 'Tiếng Việt', ma_ngon_ngu: 'VI', kich_hoat: true },
      { ten_ngon_ngu: 'Tiếng Anh', ma_ngon_ngu: 'EN', kich_hoat: true },
      { ten_ngon_ngu: 'Tiếng Nhật', ma_ngon_ngu: 'JA', kich_hoat: true },
      { ten_ngon_ngu: 'Tiếng Hàn', ma_ngon_ngu: 'KO', kich_hoat: true },
      { ten_ngon_ngu: 'Tiếng Trung', ma_ngon_ngu: 'ZH', kich_hoat: true },
      { ten_ngon_ngu: 'Tiếng Pháp', ma_ngon_ngu: 'FR', kich_hoat: true },
    ]);
    console.log(`✅ Đã tạo ${languages.length} languages\n`);

    // === CORE HR DATA ===

    // Chức danh
    console.log('📝 Tạo Chức danh...');
    const chucDanhs = await ChucDanh.insertMany([
      { ten_chuc_danh: 'Giám đốc điều hành', mo_ta: 'CEO - Giám đốc điều hành công ty' },
      { ten_chuc_danh: 'Phó giám đốc', mo_ta: 'Phó giám đốc công ty' },
      { ten_chuc_danh: 'Trưởng phòng', mo_ta: 'Quản lý phòng ban' },
      { ten_chuc_danh: 'Phó phòng', mo_ta: 'Phó phòng hỗ trợ trưởng phòng' },
      { ten_chuc_danh: 'Trưởng nhóm', mo_ta: 'Quản lý nhóm, team lead' },
      { ten_chuc_danh: 'Chuyên viên chính', mo_ta: 'Chuyên viên cao cấp có kinh nghiệm' },
      { ten_chuc_danh: 'Chuyên viên', mo_ta: 'Chuyên viên có kinh nghiệm' },
      { ten_chuc_danh: 'Nhân viên', mo_ta: 'Nhân viên thực thi' },
      { ten_chuc_danh: 'Thực tập sinh', mo_ta: 'Sinh viên thực tập' },
    ]);
    console.log(`✅ Đã tạo ${chucDanhs.length} chức danh\n`);

    // Địa điểm
    console.log('📍 Tạo Địa điểm...');
    const diaDiems = await DiaDiem.insertMany([
      { ten: 'Trụ sở chính Hà Nội', thanh_pho: 'Hà Nội', quoc_gia: 'Việt Nam', dia_chi: 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội' },
      { ten: 'Chi nhánh TP.HCM', thanh_pho: 'TP. Hồ Chí Minh', quoc_gia: 'Việt Nam', dia_chi: 'Số 268 Lý Thường Kiệt, Quận 10, TP.HCM' },
      { ten: 'Chi nhánh Đà Nẵng', thanh_pho: 'Đà Nẵng', quoc_gia: 'Việt Nam', dia_chi: 'Số 54 Nguyễn Lương Bằng, Quận Liên Chiểu, Đà Nẵng' },
      { ten: 'Văn phòng Hải Phòng', thanh_pho: 'Hải Phòng', quoc_gia: 'Việt Nam', dia_chi: 'Số 123 Lạch Tray, Ngô Quyền, Hải Phòng' },
      { ten: 'Văn phòng Cần Thơ', thanh_pho: 'Cần Thơ', quoc_gia: 'Việt Nam', dia_chi: 'Số 456 Mậu Thân, Ninh Kiều, Cần Thơ' },
    ]);
    console.log(`✅ Đã tạo ${diaDiems.length} địa điểm\n`);

    // Trạng thái lao động
    console.log('📊 Tạo Trạng thái lao động...');
    const trangThais = await TrangThaiLaoDong.insertMany([
      { ten: 'Toàn thời gian', mo_ta: 'Nhân viên làm việc toàn thời gian - 8h/ngày' },
      { ten: 'Bán thời gian', mo_ta: 'Nhân viên làm việc bán thời gian - 4h/ngày' },
      { ten: 'Hợp đồng thời vụ', mo_ta: 'Nhân viên hợp đồng có thời hạn' },
      { ten: 'Thực tập', mo_ta: 'Sinh viên thực tập' },
      { ten: 'Thử việc', mo_ta: 'Nhân viên đang trong thời gian thử việc' },
    ]);
    console.log(`✅ Đã tạo ${trangThais.length} trạng thái lao động\n`);

    // Phòng ban
    console.log('🏢 Tạo Phòng ban...');
    const phongBans = await PhongBan.insertMany([
      { ten: 'Ban Giám đốc', mo_ta: 'Ban lãnh đạo công ty' },
      { ten: 'Phòng Hành chính - Nhân sự', mo_ta: 'Quản lý hành chính và nguồn nhân lực' },
      { ten: 'Phòng Kỹ thuật', mo_ta: 'Phát triển sản phẩm và công nghệ' },
      { ten: 'Phòng Kinh doanh', mo_ta: 'Bán hàng và chăm sóc khách hàng' },
      { ten: 'Phòng Kế toán - Tài chính', mo_ta: 'Quản lý tài chính công ty' },
      { ten: 'Phòng Marketing', mo_ta: 'Marketing và truyền thông' },
      { ten: 'Phòng CNTT', mo_ta: 'Công nghệ thông tin và hệ thống' },
      { ten: 'Phòng Pháp chế', mo_ta: 'Tư vấn pháp lý và hợp đồng' },
    ]);
    console.log(`✅ Đã tạo ${phongBans.length} phòng ban\n`);

    // Loại ngày nghỉ
    console.log('🏖️  Tạo Loại ngày nghỉ...');
    const loaiNgayNghis = await LoaiNgayNghi.insertMany([
      { ten: 'Nghỉ phép năm', so_ngay_mac_dinh: 12, co_luong: true, mo_ta: 'Nghỉ phép được hưởng lương theo quy định' },
      { ten: 'Nghỉ ốm', so_ngay_mac_dinh: 30, co_luong: true, mo_ta: 'Nghỉ ốm có xác nhận y tế' },
      { ten: 'Nghỉ không lương', so_ngay_mac_dinh: 0, co_luong: false, mo_ta: 'Nghỉ không hưởng lương' },
      { ten: 'Nghỉ thai sản', so_ngay_mac_dinh: 180, co_luong: true, mo_ta: 'Nghỉ sinh con theo luật lao động Việt Nam' },
      { ten: 'Nghỉ hiếu', so_ngay_mac_dinh: 3, co_luong: true, mo_ta: 'Nghỉ tang lễ người thân' },
      { ten: 'Nghỉ kết hôn', so_ngay_mac_dinh: 3, co_luong: true, mo_ta: 'Nghỉ kết hôn' },
      { ten: 'Nghỉ con ốm', so_ngay_mac_dinh: 30, co_luong: true, mo_ta: 'Nghỉ chăm sóc con nhỏ ốm đau' },
    ]);
    console.log(`✅ Đã tạo ${loaiNgayNghis.length} loại ngày nghỉ\n`);

    // Bậc lương
    console.log('💰 Tạo Bậc lương...');
    const bacLuongs = await BacLuong.insertMany([
      { ten_bac_luong: 'Thực tập sinh', muc_luong_toi_thieu: 3000000, muc_luong_toi_da: 5000000, don_vi_tien_te: 'VND', ghi_chu: 'Lương thực tập sinh' },
      { ten_bac_luong: 'Nhân viên mới', muc_luong_toi_thieu: 7000000, muc_luong_toi_da: 12000000, don_vi_tien_te: 'VND', ghi_chu: 'Lương nhân viên mới vào làm' },
      { ten_bac_luong: 'Nhân viên', muc_luong_toi_thieu: 12000000, muc_luong_toi_da: 18000000, don_vi_tien_te: 'VND', ghi_chu: 'Lương nhân viên có kinh nghiệm' },
      { ten_bac_luong: 'Chuyên viên', muc_luong_toi_thieu: 18000000, muc_luong_toi_da: 25000000, don_vi_tien_te: 'VND', ghi_chu: 'Lương chuyên viên' },
      { ten_bac_luong: 'Chuyên viên chính', muc_luong_toi_thieu: 25000000, muc_luong_toi_da: 35000000, don_vi_tien_te: 'VND', ghi_chu: 'Lương chuyên viên cao cấp' },
      { ten_bac_luong: 'Trưởng nhóm', muc_luong_toi_thieu: 30000000, muc_luong_toi_da: 45000000, don_vi_tien_te: 'VND', ghi_chu: 'Lương trưởng nhóm, team lead' },
      { ten_bac_luong: 'Phó phòng', muc_luong_toi_thieu: 40000000, muc_luong_toi_da: 60000000, don_vi_tien_te: 'VND', ghi_chu: 'Lương phó phòng' },
      { ten_bac_luong: 'Trưởng phòng', muc_luong_toi_thieu: 50000000, muc_luong_toi_da: 80000000, don_vi_tien_te: 'VND', ghi_chu: 'Lương trưởng phòng' },
      { ten_bac_luong: 'Giám đốc', muc_luong_toi_thieu: 80000000, muc_luong_toi_da: 150000000, don_vi_tien_te: 'VND', ghi_chu: 'Lương ban giám đốc' },
    ]);
    console.log(`✅ Đã tạo ${bacLuongs.length} bậc lương\n`);

    // Ngày lễ 2025
    console.log('🎉 Tạo Ngày lễ 2025...');
    const ngayLes = await NgayLe.insertMany([
      { ten_ngay_le: 'Tết Dương lịch', ngay: new Date('2025-01-01'), lap_lai_hang_nam: true, mo_ta: 'Tết Dương lịch', khu_vuc: 'Toàn quốc' },
      { ten_ngay_le: 'Tết Nguyên đán - Mùng 1', ngay: new Date('2025-01-29'), lap_lai_hang_nam: true, mo_ta: 'Tết Nguyên đán Ất Tỵ 2025', khu_vuc: 'Toàn quốc' },
      { ten_ngay_le: 'Tết Nguyên đán - Mùng 2', ngay: new Date('2025-01-30'), lap_lai_hang_nam: true, mo_ta: 'Tết Nguyên đán Ất Tỵ 2025', khu_vuc: 'Toàn quốc' },
      { ten_ngay_le: 'Tết Nguyên đán - Mùng 3', ngay: new Date('2025-01-31'), lap_lai_hang_nam: true, mo_ta: 'Tết Nguyên đán Ất Tỵ 2025', khu_vuc: 'Toàn quốc' },
      { ten_ngay_le: 'Tết Nguyên đán - Mùng 4', ngay: new Date('2025-02-01'), lap_lai_hang_nam: true, mo_ta: 'Tết Nguyên đán Ất Tỵ 2025', khu_vuc: 'Toàn quốc' },
      { ten_ngay_le: 'Tết Nguyên đán - Mùng 5', ngay: new Date('2025-02-02'), lap_lai_hang_nam: true, mo_ta: 'Tết Nguyên đán Ất Tỵ 2025', khu_vuc: 'Toàn quốc' },
      { ten_ngay_le: 'Giỗ Tổ Hùng Vương', ngay: new Date('2025-04-06'), lap_lai_hang_nam: true, mo_ta: 'Giỗ Tổ Hùng Vương 10/3 Âm lịch', khu_vuc: 'Toàn quốc' },
      { ten_ngay_le: 'Ngày Giải phóng miền Nam', ngay: new Date('2025-04-30'), lap_lai_hang_nam: true, mo_ta: '30/4 - Ngày giải phóng miền Nam, thống nhất đất nước', khu_vuc: 'Toàn quốc' },
      { ten_ngay_le: 'Ngày Quốc tế Lao động', ngay: new Date('2025-05-01'), lap_lai_hang_nam: true, mo_ta: '1/5 - Ngày Quốc tế Lao động', khu_vuc: 'Toàn quốc' },
      { ten_ngay_le: 'Ngày Quốc khánh', ngay: new Date('2025-09-02'), lap_lai_hang_nam: true, mo_ta: 'Ngày Quốc khánh 2/9', khu_vuc: 'Toàn quốc' },
    ]);
    console.log(`✅ Đã tạo ${ngayLes.length} ngày lễ\n`);

    // === NHÂN VIÊN MẪU ===
    console.log('👥 Tạo Nhân viên...');
    const nhanViens = await NhanVien.insertMany([
      // Ban Giám đốc
      {
        ma_nhan_vien: 'NV001',
        ho_dem: 'Nguyễn Văn',
        ten: 'An',
        biet_danh: 'An',
        ngay_sinh: new Date('1980-05-15'),
        gioi_tinh: 'Nam',
        tinh_trang_hon_nhan: 'Đã kết hôn',
        lien_he: {
          email_cong_viec: 'an.nguyen@company.vn',
          di_dong: '0901234567',
          dien_thoai_nha: '024-3838-8888',
          dia_chi: 'Số 10 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2015-01-01'),
          chuc_danh_id: chucDanhs[0]._id, // Giám đốc điều hành
          trang_thai_lao_dong_id: trangThais[0]._id, // Toàn thời gian
          phong_ban_id: phongBans[0]._id, // Ban Giám đốc
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },
      {
        ma_nhan_vien: 'NV002',
        ho_dem: 'Trần Thị',
        ten: 'Bích',
        biet_danh: 'Bích',
        ngay_sinh: new Date('1985-08-20'),
        gioi_tinh: 'Nữ',
        tinh_trang_hon_nhan: 'Đã kết hôn',
        lien_he: {
          email_cong_viec: 'bich.tran@company.vn',
          di_dong: '0912345678',
          dia_chi: 'Số 25 Láng Hạ, Đống Đa, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2016-03-15'),
          chuc_danh_id: chucDanhs[1]._id, // Phó giám đốc
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[0]._id,
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },

      // Phòng Hành chính - Nhân sự
      {
        ma_nhan_vien: 'NV003',
        ho_dem: 'Lê Văn',
        ten: 'Cường',
        ngay_sinh: new Date('1988-03-10'),
        gioi_tinh: 'Nam',
        tinh_trang_hon_nhan: 'Đã kết hôn',
        lien_he: {
          email_cong_viec: 'cuong.le@company.vn',
          di_dong: '0923456789',
          dia_chi: 'Số 50 Nguyễn Chí Thanh, Đống Đa, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2018-06-01'),
          chuc_danh_id: chucDanhs[2]._id, // Trưởng phòng
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[1]._id, // Phòng Hành chính - Nhân sự
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },
      {
        ma_nhan_vien: 'NV004',
        ho_dem: 'Phạm Thị',
        ten: 'Dung',
        ngay_sinh: new Date('1992-12-25'),
        gioi_tinh: 'Nữ',
        tinh_trang_hon_nhan: 'Độc thân',
        lien_he: {
          email_cong_viec: 'dung.pham@company.vn',
          di_dong: '0934567890',
          dia_chi: 'Số 100 Trần Duy Hưng, Cầu Giấy, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2020-01-10'),
          chuc_danh_id: chucDanhs[6]._id, // Chuyên viên
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[1]._id,
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },

      // Phòng Kỹ thuật
      {
        ma_nhan_vien: 'NV005',
        ho_dem: 'Hoàng Văn',
        ten: 'Em',
        ngay_sinh: new Date('1990-07-15'),
        gioi_tinh: 'Nam',
        tinh_trang_hon_nhan: 'Đã kết hôn',
        lien_he: {
          email_cong_viec: 'em.hoang@company.vn',
          di_dong: '0945678901',
          dia_chi: 'Số 200 Giải Phóng, Hai Bà Trưng, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2017-09-01'),
          chuc_danh_id: chucDanhs[2]._id, // Trưởng phòng
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[2]._id, // Phòng Kỹ thuật
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },
      {
        ma_nhan_vien: 'NV006',
        ho_dem: 'Vũ Thị',
        ten: 'Hoa',
        ngay_sinh: new Date('1994-11-20'),
        gioi_tinh: 'Nữ',
        tinh_trang_hon_nhan: 'Độc thân',
        lien_he: {
          email_cong_viec: 'hoa.vu@company.vn',
          di_dong: '0956789012',
          dia_chi: 'Số 300 Tây Sơn, Đống Đa, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2021-02-15'),
          chuc_danh_id: chucDanhs[4]._id, // Trưởng nhóm
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[2]._id,
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },
      {
        ma_nhan_vien: 'NV007',
        ho_dem: 'Đặng Văn',
        ten: 'Khoa',
        ngay_sinh: new Date('1996-04-30'),
        gioi_tinh: 'Nam',
        tinh_trang_hon_nhan: 'Độc thân',
        lien_he: {
          email_cong_viec: 'khoa.dang@company.vn',
          di_dong: '0967890123',
          dia_chi: 'Số 400 Láng, Đống Đa, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2021-08-01'),
          chuc_danh_id: chucDanhs[6]._id, // Chuyên viên
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[2]._id,
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },
      {
        ma_nhan_vien: 'NV008',
        ho_dem: 'Bùi Thị',
        ten: 'Lan',
        ngay_sinh: new Date('1998-09-10'),
        gioi_tinh: 'Nữ',
        tinh_trang_hon_nhan: 'Độc thân',
        lien_he: {
          email_cong_viec: 'lan.bui@company.vn',
          di_dong: '0978901234',
          dia_chi: 'Số 500 Xã Đàn, Đống Đa, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2022-05-15'),
          chuc_danh_id: chucDanhs[7]._id, // Nhân viên
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[2]._id,
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },

      // Phòng Kinh doanh
      {
        ma_nhan_vien: 'NV009',
        ho_dem: 'Đinh Văn',
        ten: 'Minh',
        ngay_sinh: new Date('1987-06-25'),
        gioi_tinh: 'Nam',
        tinh_trang_hon_nhan: 'Đã kết hôn',
        lien_he: {
          email_cong_viec: 'minh.dinh@company.vn',
          di_dong: '0989012345',
          dia_chi: 'Số 123 Nguyễn Trãi, Thanh Xuân, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2019-03-01'),
          chuc_danh_id: chucDanhs[2]._id, // Trưởng phòng
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[3]._id, // Phòng Kinh doanh
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },
      {
        ma_nhan_vien: 'NV010',
        ho_dem: 'Ngô Thị',
        ten: 'Nga',
        ngay_sinh: new Date('1993-02-14'),
        gioi_tinh: 'Nữ',
        tinh_trang_hon_nhan: 'Độc thân',
        lien_he: {
          email_cong_viec: 'nga.ngo@company.vn',
          di_dong: '0990123456',
          dia_chi: 'Số 234 Khâm Thiên, Đống Đa, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2020-07-20'),
          chuc_danh_id: chucDanhs[6]._id, // Chuyên viên
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[3]._id,
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },

      // Phòng Kế toán - Tài chính
      {
        ma_nhan_vien: 'NV011',
        ho_dem: 'Trương Văn',
        ten: 'Oanh',
        ngay_sinh: new Date('1986-10-08'),
        gioi_tinh: 'Nam',
        tinh_trang_hon_nhan: 'Đã kết hôn',
        lien_he: {
          email_cong_viec: 'oanh.truong@company.vn',
          di_dong: '0901112233',
          dia_chi: 'Số 345 Nguyễn Văn Cừ, Long Biên, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2018-01-15'),
          chuc_danh_id: chucDanhs[2]._id, // Trưởng phòng
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[4]._id, // Phòng Kế toán
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },
      {
        ma_nhan_vien: 'NV012',
        ho_dem: 'Lý Thị',
        ten: 'Phương',
        ngay_sinh: new Date('1995-05-30'),
        gioi_tinh: 'Nữ',
        tinh_trang_hon_nhan: 'Độc thân',
        lien_he: {
          email_cong_viec: 'phuong.ly@company.vn',
          di_dong: '0912223344',
          dia_chi: 'Số 456 Tô Hiệu, Cầu Giấy, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2021-04-01'),
          chuc_danh_id: chucDanhs[6]._id, // Chuyên viên
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[4]._id,
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },

      // Phòng Marketing
      {
        ma_nhan_vien: 'NV013',
        ho_dem: 'Đỗ Văn',
        ten: 'Quân',
        ngay_sinh: new Date('1991-09-18'),
        gioi_tinh: 'Nam',
        tinh_trang_hon_nhan: 'Đã kết hôn',
        lien_he: {
          email_cong_viec: 'quan.do@company.vn',
          di_dong: '0923334455',
          dia_chi: 'Số 567 Trường Chinh, Thanh Xuân, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2019-08-10'),
          chuc_danh_id: chucDanhs[2]._id, // Trưởng phòng
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[5]._id, // Phòng Marketing
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },
      {
        ma_nhan_vien: 'NV014',
        ho_dem: 'Hồ Thị',
        ten: 'Thanh',
        ngay_sinh: new Date('1997-12-05'),
        gioi_tinh: 'Nữ',
        tinh_trang_hon_nhan: 'Độc thân',
        lien_he: {
          email_cong_viec: 'thanh.ho@company.vn',
          di_dong: '0934445566',
          dia_chi: 'Số 678 Giảng Võ, Ba Đình, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2022-03-20'),
          chuc_danh_id: chucDanhs[7]._id, // Nhân viên
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[5]._id,
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },

      // Chi nhánh TP.HCM
      {
        ma_nhan_vien: 'NV015',
        ho_dem: 'Phan Văn',
        ten: 'Tùng',
        ngay_sinh: new Date('1989-07-22'),
        gioi_tinh: 'Nam',
        tinh_trang_hon_nhan: 'Đã kết hôn',
        lien_he: {
          email_cong_viec: 'tung.phan@company.vn',
          di_dong: '0945556677',
          dia_chi: 'Số 789 Lê Văn Sỹ, Quận 3, TP.HCM',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2018-11-01'),
          chuc_danh_id: chucDanhs[2]._id, // Trưởng phòng
          trang_thai_lao_dong_id: trangThais[0]._id,
          phong_ban_id: phongBans[3]._id, // Phòng Kinh doanh
          dia_diem_lam_viec_ids: [diaDiems[1]._id], // TP.HCM
        },
      },

      // Thực tập sinh
      {
        ma_nhan_vien: 'NV016',
        ho_dem: 'Trịnh Thị',
        ten: 'Uyên',
        ngay_sinh: new Date('2002-03-15'),
        gioi_tinh: 'Nữ',
        tinh_trang_hon_nhan: 'Độc thân',
        lien_he: {
          email_cong_viec: 'uyen.trinh@company.vn',
          di_dong: '0956667788',
          dia_chi: 'Số 890 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2024-09-01'),
          chuc_danh_id: chucDanhs[8]._id, // Thực tập sinh
          trang_thai_lao_dong_id: trangThais[3]._id, // Thực tập
          phong_ban_id: phongBans[2]._id, // Phòng Kỹ thuật
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
      },
    ]);
    console.log(`✅ Đã tạo ${nhanViens.length} nhân viên\n`);

    // === PROJECTS & ACTIVITIES ===
    console.log('📁 Tạo Projects...');
    const projects = await Project.insertMany([
      {
        ten: 'Hệ thống quản lý nhân sự',
        mo_ta: 'Xây dựng hệ thống HRM toàn diện',
        kich_hoat: true,
      },
      {
        ten: 'Website thương mại điện tử',
        mo_ta: 'Phát triển nền tảng thương mại điện tử',
        kich_hoat: true,
      },
    ]);
    console.log(`✅ Đã tạo ${projects.length} projects\n`);

    console.log('⚡ Tạo Activities...');
    const activities = await Activity.insertMany([
      { project_id: projects[0]._id, ten: 'Phân tích yêu cầu', kich_hoat: true },
      { project_id: projects[0]._id, ten: 'Thiết kế hệ thống', kich_hoat: true },
      { project_id: projects[0]._id, ten: 'Phát triển Backend', kich_hoat: true },
      { project_id: projects[0]._id, ten: 'Phát triển Frontend', kich_hoat: true },
      { project_id: projects[1]._id, ten: 'Testing', kich_hoat: true },
      { project_id: projects[1]._id, ten: 'Deployment', kich_hoat: true },
    ]);
    console.log(`✅ Đã tạo ${activities.length} activities\n`);

    // === USERS (TÀI KHOẢN ĐĂNG NHẬP) ===
    console.log('🔐 Tạo Users...');
    const password = await bcrypt.hash('123456', 10);
    const users = await User.insertMany([
      {
        email: 'admin@company.vn',
        password_hash: password,
        role: 'admin',
        nhan_vien_id: nhanViens[0]._id, // Nguyễn Văn An - CEO
      },
      {
        email: 'manager@company.vn',
        password_hash: password,
        role: 'manager',
        nhan_vien_id: nhanViens[2]._id, // Lê Văn Cường - Trưởng phòng Nhân sự
      },
      {
        email: 'employee@company.vn',
        password_hash: password,
        role: 'employee',
        nhan_vien_id: nhanViens[3]._id, // Phạm Thị Dung - Nhân viên
      },
      {
        email: 'employee2@company.vn',
        password_hash: password,
        role: 'employee',
        nhan_vien_id: nhanViens[6]._id, // Đặng Văn Khoa - Chuyên viên
      },
      {
        email: 'employee3@company.vn',
        password_hash: password,
        role: 'employee',
        nhan_vien_id: nhanViens[7]._id, // Bùi Thị Lan - Nhân viên
      },
    ]);
    console.log(`✅ Đã tạo ${users.length} users\n`);

    // Hiển thị thông tin đăng nhập
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 KHỞI TẠO DATABASE THÀNH CÔNG!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n📋 THÔNG TIN ĐĂNG NHẬP (Tất cả mật khẩu: 123456):');
    console.log('───────────────────────────────────────────────────────────────');
    console.log('\n👤 ADMIN (CEO - Nguyễn Văn An):');
    console.log('   Email:    admin@company.vn');
    console.log('   Password: 123456');
    console.log('   Quyền:    Toàn quyền hệ thống');

    console.log('\n👤 MANAGER (Trưởng phòng Nhân sự - Lê Văn Cường):');
    console.log('   Email:    manager@company.vn');
    console.log('   Password: 123456');
    console.log('   Quyền:    Quản lý nhân sự, phê duyệt');

    console.log('\n👤 EMPLOYEE (Chuyên viên - Phạm Thị Dung):');
    console.log('   Email:    employee@company.vn');
    console.log('   Password: 123456');
    console.log('   Quyền:    Nhân viên thường');

    console.log('\n👤 EMPLOYEE 2 (Chuyên viên - Đặng Văn Khoa):');
    console.log('   Email:    employee2@company.vn');
    console.log('   Password: 123456');
    console.log('   Quyền:    Nhân viên thường');

    console.log('\n👤 EMPLOYEE 3 (Nhân viên - Bùi Thị Lan):');
    console.log('   Email:    employee3@company.vn');
    console.log('   Password: 123456');
    console.log('   Quyền:    Nhân viên thường');

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    console.log('📊 TỔNG KẾT DỮ LIỆU:');
    console.log('───────────────────────────────────────────────────────────────');
    console.log('   🏢 Cấu hình Admin:');
    console.log(`      ✅ ${employmentStatuses.length} employment statuses`);
    console.log(`      ✅ ${jobCategories.length} job categories`);
    console.log(`      ✅ ${nationalities.length} nationalities`);
    console.log(`      ✅ ${skills.length} skills`);
    console.log(`      ✅ ${educationLevels.length} education levels`);
    console.log(`      ✅ ${languages.length} languages`);

    console.log('\n   👥 Dữ liệu nhân sự:');
    console.log(`      ✅ ${chucDanhs.length} chức danh`);
    console.log(`      ✅ ${diaDiems.length} địa điểm`);
    console.log(`      ✅ ${trangThais.length} trạng thái lao động`);
    console.log(`      ✅ ${phongBans.length} phòng ban`);
    console.log(`      ✅ ${loaiNgayNghis.length} loại ngày nghỉ`);
    console.log(`      ✅ ${bacLuongs.length} bậc lương`);
    console.log(`      ✅ ${ngayLes.length} ngày lễ (2025)`);
    console.log(`      ✅ ${nhanViens.length} nhân viên`);

    console.log('\n   📁 Dự án:');
    console.log(`      ✅ ${projects.length} projects`);
    console.log(`      ✅ ${activities.length} activities`);

    console.log('\n   🔐 Tài khoản:');
    console.log(`      ✅ ${users.length} users`);

    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('✨ Hệ thống đã sẵn sàng sử dụng!');
    console.log('🌐 Truy cập: http://localhost:54115');
    console.log('───────────────────────────────────────────────────────────────\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

seedDatabase();
