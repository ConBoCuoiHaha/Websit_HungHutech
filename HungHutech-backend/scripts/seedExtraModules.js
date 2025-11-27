/**
 * Seed thêm dữ liệu mẫu cho các module: Tuyển dụng, Hiệu suất, Dự án/Hoạt động,
 * Timesheet, OT, Phân ca. Không xóa dữ liệu hiện có; chỉ chèn nếu chưa tồn tại
 * (dựa trên tên/email/mã duy nhất).
 */
require('dotenv').config();
const mongoose = require('mongoose');

const Vacancy = require('../schemas/vacancy.model');
const Candidate = require('../schemas/candidate.model');
const Application = require('../schemas/application.model');
const Interview = require('../schemas/interview.model');
const KPI = require('../schemas/kpi.model');
const PerformanceReview = require('../schemas/performanceReview.model');
const Project = require('../schemas/project.model');
const Activity = require('../schemas/activity.model');
const Timesheet = require('../schemas/timesheet.model');
const OvertimeRequest = require('../schemas/overtimeRequest.model');
const ShiftAssignment = require('../schemas/shiftAssignment.model');
const CaLamViec = require('../schemas/caLamViec.model');
const NhanVien = require('../schemas/nhanVien.model');

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGODB_ATLAS_URI ||
  'mongodb://localhost:27017/HungHutech';

const today = new Date();
const startOfDay = (d) => {
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  return dd;
};

async function main() {
  await mongoose.connect(MONGO_URI, {maxPoolSize: 10});
  console.log('Connected to MongoDB');

  const employees = await NhanVien.find({})
    .select('_id ma_nhan_vien ho_dem ten')
    .limit(5)
    .lean();
  if (!employees.length) throw new Error('Không có nhân viên để liên kết dữ liệu.');
  const employeeId = employees[0]._id;
  const managerId = employees[1]?._id || employeeId;

  // Tuyển dụng
  const vacancy = await Vacancy.findOneAndUpdate(
    {tieu_de: 'Junior Backend Developer (demo)'},
    {
      $setOnInsert: {
        mo_ta: 'Tuyển lập trình viên Node.js mức junior cho sản phẩm HRM.',
        so_luong: 2,
        muc_luong: '15-25tr',
        ky_nang: ['Node.js', 'MongoDB', 'REST'],
        hiring_manager_id: managerId,
        han_nop: new Date(today.getTime() + 20 * 86400000),
      },
    },
    {upsert: true, new: true},
  );

  const candidate = await Candidate.findOneAndUpdate(
    {email: 'candidate.demo@company.vn'},
    {
      $setOnInsert: {
        ho_ten: 'Ứng viên Demo',
        dien_thoai: '0909009900',
        nguon: 'Referral',
        ky_nang: ['Node.js', 'SQL'],
        pipeline_stage: 'Screening',
      },
    },
    {upsert: true, new: true},
  );

  await Application.findOneAndUpdate(
    {vacancy_id: vacancy._id, candidate_id: candidate._id},
    {
      $setOnInsert: {
        trang_thai: 'Phong van',
        ghi_chu: 'Ứng viên tiềm năng cho vị trí junior.',
      },
    },
    {upsert: true, new: true},
  );

  await Interview.findOneAndUpdate(
    {
      ung_vien_id: candidate._id,
      vi_tri_tuyen_dung_id: vacancy._id,
      loai_phong_van: 'Phỏng vấn chuyên môn',
    },
    {
      $setOnInsert: {
        ngay_gio: new Date(today.getTime() + 2 * 86400000),
        dia_diem: 'Phòng họp Zoom',
        hinh_thuc: 'Trực tuyến',
        nguoi_phong_van: [{nhan_vien_id: managerId, vai_tro: 'Leader'}],
        trang_thai: 'Đã xác nhận',
      },
    },
    {upsert: true, new: true},
  );

  // KPI + Review
  const kpi = await KPI.findOneAndUpdate(
    {ten: 'Đóng góp code features'},
    {$setOnInsert: {mo_ta: 'Số feature hoàn thành/ Sprint', trong_so: 40}},
    {upsert: true, new: true},
  );

  await PerformanceReview.findOneAndUpdate(
    {
      nhan_vien_id: employeeId,
      nguoi_danh_gia_id: managerId,
      tu_ngay: startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)),
    },
    {
      $setOnInsert: {
        den_ngay: startOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
        trang_thai: 'Completed',
        xep_loai: 'B',
        ratings: [{kpi_id: kpi._id, diem: 4, ghi_chu: 'Hoàn thành tốt'}],
        diem_tong: 4,
      },
    },
    {upsert: true, new: true},
  );

  // Project + Activity
  const project = await Project.findOneAndUpdate(
    {ten: 'HRM Mobile App'},
    {$setOnInsert: {khach_hang: 'Nội bộ', trang_thai: 'Hoạt động', kich_hoat: true}},
    {upsert: true, new: true},
  );

  const activity = await Activity.findOneAndUpdate(
    {ten: 'Phat trien API chinh', project_id: project._id},
    {$setOnInsert: {mo_ta: 'Build API mobile', trang_thai: 'Dang hoat dong', kich_hoat: true}},
    {upsert: true, new: true},
  );

  // Timesheet (1 tuần)
  const monday = startOfDay(new Date(today.getTime() - ((today.getDay() + 6) % 7) * 86400000));
  await Timesheet.findOneAndUpdate(
    {nhan_vien_id: employeeId, tuan_bat_dau: monday},
    {
      $setOnInsert: {
        entries: [
          {
            ngay: monday,
            project_id: project._id,
            activity_id: activity._id,
            gio: 8,
            ghi_chu: 'Dev mobile APIs',
          },
          {
            ngay: new Date(monday.getTime() + 1 * 86400000),
            project_id: project._id,
            activity_id: activity._id,
            gio: 7.5,
            ghi_chu: 'Fix bug + review',
          },
        ],
        trang_thai: 'Da duyet',
        nguoi_duyet_id: managerId,
      },
    },
    {upsert: true, new: true},
  );

  // OT
  await OvertimeRequest.findOneAndUpdate(
    {
      nhan_vien_id: employeeId,
      ngay: startOfDay(today),
      loai_ngay: 'weekday_night',
    },
    {
      $setOnInsert: {
        thoi_gian_bat_dau: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 0, 0),
        thoi_gian_ket_thuc: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 21, 0, 0),
        so_gio: 2,
        he_so: 1.5,
        trang_thai: 'Da duyet',
        ly_do: 'Hoàn thành release nóng',
        nguoi_duyet_id: managerId,
      },
    },
    {upsert: true, new: true},
  );

  // Phân ca linh hoạt (Shift assignment)
  const ca = await CaLamViec.findOne().lean();
  if (ca) {
    await ShiftAssignment.findOneAndUpdate(
      {nhan_vien_id: employeeId, ngay: startOfDay(new Date(today.getTime() + 1 * 86400000))},
      {
        $setOnInsert: {
          ca_lam_viec_id: ca._id,
          shift_snapshot: {
            ten_ca: ca.ten_ca,
            gio_bat_dau: ca.gio_bat_dau,
            gio_ket_thuc: ca.gio_ket_thuc,
            thoi_gian_nghi: ca.thoi_gian_nghi,
          },
          nguoi_phan_cong_id: managerId,
          ghi_chu: 'Phan ca linh hoat (seed)',
        },
      },
      {upsert: true, new: true},
    );
  } else {
    console.warn('Không tìm thấy ca làm việc để phân ca.');
  }

  console.log('Seed thêm dữ liệu module tuyển dụng/hiệu suất/dự án/OT/ca làm việc hoàn tất.');
  await mongoose.disconnect();
}

main()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
