require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const timeRuleEngine = require('../services/timeRuleEngine');
const {calculatePayrollEntry} = require('../utils/payrollEngine');
const consentPurposes = require('../config/consentPurposes');

// Models
const User = require('../schemas/user.model');
const NhanVien = require('../schemas/nhanVien.model');
const ChucDanh = require('../schemas/chucDanh.model');
const PhongBan = require('../schemas/phongBan.model');
const DiaDiem = require('../schemas/diaDiem.model');
const TrangThaiLaoDong = require('../schemas/trangThaiLaoDong.model');
const LoaiNgayNghi = require('../schemas/loaiNgayNghi.model');
const NgayLe = require('../schemas/ngayLe.model');
const CaLamViec = require('../schemas/caLamViec.model');
const QuyenNghiPhep = require('../schemas/quyenNghiPhep.model');
const YeuCauNghiPhep = require('../schemas/yeuCauNghiPhep.model');
const ChamCong = require('../schemas/chamCong.model');
const ShiftAssignment = require('../schemas/shiftAssignment.model');
const Timesheet = require('../schemas/timesheet.model');
const OvertimeRequest = require('../schemas/overtimeRequest.model');
const PayrollRun = require('../schemas/payrollRun.model');
const Project = require('../schemas/project.model');
const Activity = require('../schemas/activity.model');
const EmployeeDocument = require('../schemas/employeeDocument.model');
const Contract = require('../schemas/contract.model');
const ProfileRequest = require('../schemas/profileRequest.model');
const Consent = require('../schemas/consent.model');
const ComplianceReportLog = require('../schemas/complianceReportLog.model');
const ComplianceReminderLog = require('../schemas/complianceReminderLog.model');
const Offboarding = require('../schemas/offboarding.model');
const DailyTimeSummary = require('../schemas/dailyTimeSummary.model');

const appendMode =
  process.argv.includes('--append') || process.env.SEED_APPEND === 'true';

const decimal = (value) =>
  mongoose.Types.Decimal128.fromString(Number(value).toFixed(0));

const normalizeDay = (input) => {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
};

const setTime = (input, hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const date = new Date(input);
  date.setHours(h, m, 0, 0);
  return date;
};

async function ensureDocuments(model, docs, filterBuilder) {
  const results = [];
  for (const doc of docs) {
    const filter =
      typeof filterBuilder === 'function'
        ? filterBuilder(doc)
        : {[filterBuilder]: doc[filterBuilder]};
    const existing = await model.findOne(filter);
    if (existing) {
      results.push(existing);
    } else {
      const created = await model.create(doc);
      results.push(created);
    }
  }
  return results;
}

async function insertIfMissing(model, filter, payload) {
  const existing = await model.findOne(filter);
  if (existing) return existing;
  return model.create(payload);
}

async function clearCollections() {
  await Promise.all([
    User.deleteMany({}),
    NhanVien.deleteMany({}),
    ChucDanh.deleteMany({}),
    PhongBan.deleteMany({}),
    DiaDiem.deleteMany({}),
    TrangThaiLaoDong.deleteMany({}),
    LoaiNgayNghi.deleteMany({}),
    NgayLe.deleteMany({}),
    CaLamViec.deleteMany({}),
    QuyenNghiPhep.deleteMany({}),
    YeuCauNghiPhep.deleteMany({}),
    ChamCong.deleteMany({}),
    ShiftAssignment.deleteMany({}),
    Timesheet.deleteMany({}),
    OvertimeRequest.deleteMany({}),
    PayrollRun.deleteMany({}),
    Project.deleteMany({}),
    Activity.deleteMany({}),
    EmployeeDocument.deleteMany({}),
    Contract.deleteMany({}),
    ProfileRequest.deleteMany({}),
    Consent.deleteMany({}),
    ComplianceReportLog.deleteMany({}),
    ComplianceReminderLog.deleteMany({}),
    Offboarding.deleteMany({}),
    DailyTimeSummary.deleteMany({}),
  ]);
}

async function seedLookups() {
  const chucDanhDocs = [
    {ten_chuc_danh: 'Tong Giam Doc', mo_ta: 'Lanh dao cap cao'},
    {ten_chuc_danh: 'HR Manager', mo_ta: 'Quan ly nhan su'},
    {ten_chuc_danh: 'Senior Engineer', mo_ta: 'Ky su chu luc'},
    {ten_chuc_danh: 'Sales Lead', mo_ta: 'Truong nhom kinh doanh'},
    {ten_chuc_danh: 'Finance Specialist', mo_ta: 'Chuyen vien ke toan'},
    {ten_chuc_danh: 'Intern', mo_ta: 'Thuc tap sinh'},
  ];
  const phongBanDocs = [
    {ten: 'Ban Dieu hanh', mo_ta: 'Dieu hanh doanh nghiep'},
    {ten: 'Phong Nhan su', mo_ta: 'Quan tri nhan su'},
    {ten: 'Phong Ky thuat', mo_ta: 'Phat trien san pham'},
    {ten: 'Phong Kinh doanh', mo_ta: 'Phu trach doanh thu'},
    {ten: 'Phong Tai chinh', mo_ta: 'Quan tri tai chinh'},
  ];
  const diaDiemDocs = [
    {ten: 'Ho Chi Minh Campus', thanh_pho: 'TPHCM', quoc_gia: 'Viet Nam', dia_chi: '19 Nguyen Huu Canh'},
    {ten: 'Ha Noi Branch', thanh_pho: 'Ha Noi', quoc_gia: 'Viet Nam', dia_chi: '1 Le Duan'},
    {ten: 'Da Nang Lab', thanh_pho: 'Da Nang', quoc_gia: 'Viet Nam', dia_chi: '99 Nguyen Van Linh'},
  ];
  const trangThaiDocs = [
    {ten: 'Chinh thuc', mo_ta: 'Nhan vien chinh thuc'},
    {ten: 'Hop dong 1 nam', mo_ta: 'Hop dong co thoi han'},
    {ten: 'Thu viec', mo_ta: 'Nhan vien dang thu viec'},
    {ten: 'Thuc tap', mo_ta: 'Sinh vien thuc tap'},
  ];
  const loaiNgayNghiDocs = [
    {ten: 'Nghi phep nam', so_ngay_mac_dinh: 12, co_luong: true, mo_ta: 'Huong luong'},
    {ten: 'Nghi benh BHXH', so_ngay_mac_dinh: 30, co_luong: true, mo_ta: 'Yeu cau giay toi'},
    {ten: 'Nghi khong luong', so_ngay_mac_dinh: 0, co_luong: false, mo_ta: 'Khong huong luong'},
    {ten: 'Cong tac', so_ngay_mac_dinh: 5, co_luong: true, mo_ta: 'Di cong tac'},
  ];
  const caLamViecDocs = [
    {ten_ca: 'Ca hanh chinh', gio_bat_dau: '08:30', gio_ket_thuc: '17:30', thoi_gian_nghi: 60},
    {ten_ca: 'Ca chieu', gio_bat_dau: '13:00', gio_ket_thuc: '21:00', thoi_gian_nghi: 45},
    {ten_ca: 'Ca dem', gio_bat_dau: '20:00', gio_ket_thuc: '23:30', thoi_gian_nghi: 30},
  ];

  const [chucDanhs, phongBans, diaDiems, trangThais] = appendMode
    ? await Promise.all([
        ensureDocuments(ChucDanh, chucDanhDocs, 'ten_chuc_danh'),
        ensureDocuments(PhongBan, phongBanDocs, 'ten'),
        ensureDocuments(DiaDiem, diaDiemDocs, 'ten'),
        ensureDocuments(TrangThaiLaoDong, trangThaiDocs, 'ten'),
      ])
    : await Promise.all([
        ChucDanh.insertMany(chucDanhDocs),
        PhongBan.insertMany(phongBanDocs),
        DiaDiem.insertMany(diaDiemDocs),
        TrangThaiLaoDong.insertMany(trangThaiDocs),
      ]);

  const loaiNgayNghis = appendMode
    ? await ensureDocuments(LoaiNgayNghi, loaiNgayNghiDocs, 'ten')
    : await LoaiNgayNghi.insertMany(loaiNgayNghiDocs);

  const caLamViecs = appendMode
    ? await ensureDocuments(CaLamViec, caLamViecDocs, 'ten_ca')
    : await CaLamViec.insertMany(caLamViecDocs);

  const ngayLeDocs = [
    {ten_ngay_le: 'Giai phong', ngay: new Date('2025-04-30T00:00:00+07:00'), lap_lai_hang_nam: true},
    {ten_ngay_le: 'Quoc te lao dong', ngay: new Date('2025-05-01T00:00:00+07:00'), lap_lai_hang_nam: true},
  ];
  if (appendMode) {
    for (const doc of ngayLeDocs) {
      await NgayLe.findOneAndUpdate(
        {ten_ngay_le: doc.ten_ngay_le},
        {$setOnInsert: doc},
        {upsert: true, new: true, setDefaultsOnInsert: true},
      );
    }
  } else {
    await NgayLe.insertMany(ngayLeDocs);
  }

  const projectDocs = [
    {ten: 'HRM Portal', khach_hang: 'Noi bo', trang_thai: 'Hoạt động'},
    {ten: 'ESS Mobile App', khach_hang: 'Noi bo', trang_thai: 'Hoạt động'},
  ];
  const projects = appendMode
    ? await ensureDocuments(Project, projectDocs, 'ten')
    : await Project.insertMany(projectDocs);

  const activityDocs = [
    {project: 'HRM Portal', ten: 'Phan tich nghiep vu', mo_ta: 'Lam viec voi HR'},
    {project: 'HRM Portal', ten: 'Phat trien Web', mo_ta: 'Viet code'},
    {project: 'ESS Mobile App', ten: 'Thiet ke UI', mo_ta: 'Prototype'},
    {project: 'ESS Mobile App', ten: 'Kiem thu', mo_ta: 'Test tren thiet bi'},
  ];
  const activities = [];
  for (const doc of activityDocs) {
    const project = projects.find((p) => p.ten === doc.project);
    if (!project) continue;
    const payload = {
      project_id: project._id,
      ten: doc.ten,
      mo_ta: doc.mo_ta,
    };
    const existing = await Activity.findOne({
      project_id: project._id,
      ten: doc.ten,
    });
    if (existing) activities.push(existing);
    else activities.push(await Activity.create(payload));
  }

  return {
    chucDanhs,
    phongBans,
    diaDiems,
    trangThais,
    loaiNgayNghis,
    caLamViecs,
    projects,
    activities,
  };
}

async function seedEmployees(lookups) {
  const {chucDanhs, phongBans, diaDiems, trangThais, caLamViecs} = lookups;
  const todayYear = new Date().getFullYear();
  const seed = [
    {
      code: 'NV100',
      ho_dem: 'Le Quang',
      ten: 'Huy',
      gioi_tinh: 'Nam',
      phongBan: phongBans[0],
      role: chucDanhs[0],
      status: trangThais[0],
      shift: caLamViecs[0],
      email: 'ceo@demo-hutech.vn',
      phone: '0908000001',
      baseSalary: 45000000,
      allowances: [
        {ten: 'Phu cap trach nhiem', so_tien: 5000000},
        {ten: 'Ho tro xang xe', so_tien: 2000000},
      ],
      dependents: [{ten: 'Le Gia Han', moi_quan_he: 'Con', ngay_sinh: new Date('2017-05-05')}],
      baoHiemRate: 36000000,
    },
    {
      code: 'NV101',
      ho_dem: 'Tran Thu',
      ten: 'Ha',
      gioi_tinh: 'Nu',
      phongBan: phongBans[1],
      role: chucDanhs[1],
      status: trangThais[0],
      shift: caLamViecs[0],
      email: 'hr@demo-hutech.vn',
      phone: '0908000002',
      baseSalary: 28000000,
      allowances: [{ten: 'Phu cap an trua', so_tien: 1200000}],
      dependents: [{ten: 'Nguyen Gia Long', moi_quan_he: 'Con', ngay_sinh: new Date('2015-03-15')}],
      baoHiemRate: 22000000,
    },
    {
      code: 'NV102',
      ho_dem: 'Nguyen Minh',
      ten: 'Khoa',
      gioi_tinh: 'Nam',
      phongBan: phongBans[2],
      role: chucDanhs[2],
      status: trangThais[1],
      shift: caLamViecs[0],
      email: 'engineer@demo-hutech.vn',
      phone: '0908000003',
      baseSalary: 25000000,
      allowances: [
        {ten: 'Phu cap an trua', so_tien: 1200000},
        {ten: 'Tro cap dien thoai', so_tien: 800000},
      ],
      dependents: [],
      baoHiemRate: 20000000,
    },
    {
      code: 'NV103',
      ho_dem: 'Pham Bao',
      ten: 'Tram',
      gioi_tinh: 'Nu',
      phongBan: phongBans[3],
      role: chucDanhs[3],
      status: trangThais[1],
      shift: caLamViecs[1],
      email: 'sales@demo-hutech.vn',
      phone: '0908000004',
      baseSalary: 23000000,
      allowances: [{ten: 'Thuong doanh so', so_tien: 3000000}],
      dependents: [],
      baoHiemRate: 20000000,
    },
    {
      code: 'NV104',
      ho_dem: 'Vo Thanh',
      ten: 'Nam',
      gioi_tinh: 'Nam',
      phongBan: phongBans[4],
      role: chucDanhs[4],
      status: trangThais[0],
      shift: caLamViecs[0],
      email: 'finance@demo-hutech.vn',
      phone: '0908000005',
      baseSalary: 22000000,
      allowances: [{ten: 'Phu cap xang xe', so_tien: 1000000}],
      dependents: [{ten: 'Vo Thao Nhi', moi_quan_he: 'Vo/Chong', ngay_sinh: new Date('1994-09-09')}],
      baoHiemRate: 20000000,
    },
    {
      code: 'NV105',
      ho_dem: 'Do Huu',
      ten: 'Tai',
      gioi_tinh: 'Nam',
      phongBan: phongBans[2],
      role: chucDanhs[5],
      status: trangThais[3],
      shift: caLamViecs[0],
      email: 'intern@demo-hutech.vn',
      phone: '0908000006',
      baseSalary: 8000000,
      allowances: [{ten: 'Tro cap an trua', so_tien: 600000}],
      dependents: [],
      baoHiemRate: 0,
    },
  ];

  const employees = [];
  for (const person of seed) {
    let employee = await NhanVien.findOne({ma_nhan_vien: person.code});
    if (!employee) {
      employee = await NhanVien.create({
        ma_nhan_vien: person.code,
        ho_dem: person.ho_dem,
        ten: person.ten,
        ngay_sinh: new Date('1990-01-01'),
        gioi_tinh: person.gioi_tinh,
        quoc_tich: 'Vietnam',
        thong_tin_ca_nhan: {
          cmnd_cccd: `079${Math.floor(Math.random() * 1_000_000)}`,
          ngay_cap_cmnd: new Date('2010-01-01'),
          noi_cap_cmnd: 'TPHCM',
        },
        dia_chi: {
          duong_so_1: '123 Nguyen Thi Minh Khai',
          thanh_pho: 'TPHCM',
          tinh_thanh: 'Ho Chi Minh',
          ma_buu_dien: '700000',
          quoc_gia: 'Viet Nam',
        },
        lien_he: {
          di_dong: person.phone,
          email_cong_viec: person.email,
        },
        bao_hiem: {
          so_bhxh: `BHXH-${person.code}`,
          so_bhyt: `BHYT-${person.code}`,
          muc_luong_bhxh: decimal(person.baoHiemRate || person.baseSalary),
          muc_luong_bhyt: decimal(person.baoHiemRate || person.baseSalary),
          ti_le_bhxh_nv: 0.08,
          ti_le_bhxh_dn: 0.175,
          ti_le_bhyt_nv: 0.015,
          ti_le_bhyt_dn: 0.03,
          ti_le_bhtn_nv: 0.01,
          ti_le_bhtn_dn: 0.01,
        },
        thong_tin_cong_viec: {
          ngay_vao_lam: new Date('2020-01-02'),
          chuc_danh_id: person.role._id,
          trang_thai_lao_dong_id: person.status._id,
          phong_ban_id: person.phongBan._id,
          ca_lam_viec_id: person.shift._id,
          dia_diem_lam_viec_ids: [diaDiems[0]._id],
        },
        nguoi_phu_thuoc: person.dependents,
        luong: [
          {
            ten_luong: 'Luong co ban',
            so_tien: decimal(person.baseSalary),
            don_vi_tien_te: 'VND',
            ky_tra_luong: 'Hang thang',
          },
          ...person.allowances.map((a) => ({
            ten_luong: a.ten,
            so_tien: decimal(a.so_tien),
            don_vi_tien_te: 'VND',
            ky_tra_luong: 'Hang thang',
          })),
        ],
        lien_he_khan_cap: [
          {
            ten: 'Nguoi nha',
            moi_quan_he: 'Gia dinh',
            di_dong: '0909000000',
          },
        ],
        hoc_van: [
          {
            truong: 'Dai hoc Hutech',
            bang_cap: 'Dai hoc',
            chuyen_nganh: 'Quan tri kinh doanh',
            nam_bat_dau: todayYear - 10,
            nam_ket_thuc: todayYear - 6,
          },
        ],
      });
    }
    employees.push(employee);
  }

  const passwordHash = await bcrypt.hash('123456', 10);
  const userConfigs = [
    {email: 'ceo@demo-hutech.vn', role: 'admin', empIndex: 0},
    {email: 'hr@demo-hutech.vn', role: 'manager', empIndex: 1},
    {email: 'engineer@demo-hutech.vn', role: 'employee', empIndex: 2},
  ];
  const users = [];
  for (const config of userConfigs) {
    let user = await User.findOne({email: config.email});
    if (!user) {
      user = await User.create({
        email: config.email,
        password_hash: passwordHash,
        role: config.role,
        nhan_vien_id: employees[config.empIndex]._id,
      });
    }
    users.push(user);
  }

  return {employees, users, seedMeta: seed};
}

async function seedLeaveAndTimeData(lookups, employees) {
  const {loaiNgayNghis, caLamViecs} = lookups;
  const phepNam = loaiNgayNghis[0];
  const nghiBenh = loaiNgayNghis[1];

  for (let index = 0; index < employees.length; index += 1) {
    const emp = employees[index];
    await QuyenNghiPhep.findOneAndUpdate(
      {
        nhan_vien_id: emp._id,
        loai_ngay_nghi_id: phepNam._id,
        nam: 2025,
      },
      {
        $setOnInsert: {
          so_ngay_duoc_huong: 12,
          so_ngay_da_su_dung: index % 3,
        },
      },
      {upsert: true},
    );
  }

  const leaveRequestsPayload = [
    {
      nhan_vien_id: employees[2]._id,
      loai_ngay_nghi_id: nghiBenh._id,
      ngay_bat_dau: new Date('2025-04-11T00:00:00+07:00'),
      ngay_ket_thuc: new Date('2025-04-11T00:00:00+07:00'),
      so_ngay: 1,
      ly_do: 'Cam cum',
      trang_thai: 'Da duyet',
      nguoi_duyet_id: employees[1]._id,
    },
    {
      nhan_vien_id: employees[3]._id,
      loai_ngay_nghi_id: phepNam._id,
      ngay_bat_dau: new Date('2025-05-02T00:00:00+07:00'),
      ngay_ket_thuc: new Date('2025-05-03T00:00:00+07:00'),
      so_ngay: 2,
      ly_do: 'Nghi phep nam',
      trang_thai: 'Cho duyet',
    },
  ];
  const leaveRequests = [];
  for (const payload of leaveRequestsPayload) {
    const existing = await YeuCauNghiPhep.findOne({
      nhan_vien_id: payload.nhan_vien_id,
      ngay_bat_dau: payload.ngay_bat_dau,
      loai_ngay_nghi_id: payload.loai_ngay_nghi_id,
    });
    if (existing) leaveRequests.push(existing);
    else leaveRequests.push(await YeuCauNghiPhep.create(payload));
  }

  const engineer = employees[2];
  const sales = employees[3];
  const start = normalizeDay('2025-04-08');
  const shiftSnapshot = {
    hanhChinh: {
      ten_ca: caLamViecs[0].ten_ca,
      gio_bat_dau: caLamViecs[0].gio_bat_dau,
      gio_ket_thuc: caLamViecs[0].gio_ket_thuc,
      thoi_gian_nghi: caLamViecs[0].thoi_gian_nghi,
    },
    caChieu: {
      ten_ca: caLamViecs[1].ten_ca,
      gio_bat_dau: caLamViecs[1].gio_bat_dau,
      gio_ket_thuc: caLamViecs[1].gio_ket_thuc,
      thoi_gian_nghi: caLamViecs[1].thoi_gian_nghi,
    },
  };

  const assignmentDocs = [];
  for (let i = 0; i < 5; i += 1) {
    const date = normalizeDay(new Date(start.getTime() + i * 86400000));
    assignmentDocs.push(
      {
        nhan_vien_id: engineer._id,
        ngay: date,
        ca_lam_viec_id: caLamViecs[0]._id,
        shift_snapshot: shiftSnapshot.hanhChinh,
      },
      {
        nhan_vien_id: sales._id,
        ngay: date,
        ca_lam_viec_id: caLamViecs[1]._id,
        shift_snapshot: shiftSnapshot.caChieu,
      },
    );
  }
  for (const assignment of assignmentDocs) {
    await ShiftAssignment.collection.updateOne(
      {
        nhan_vien_id: assignment.nhan_vien_id,
        ngay: assignment.ngay,
      },
      {
        $setOnInsert: {
          ...assignment,
          employeeId: assignment.nhan_vien_id,
          date: assignment.ngay,
          shiftId: assignment.ca_lam_viec_id,
        },
      },
      {upsert: true},
    );
  }

  const attendancePayload = [
    {
      employee: engineer,
      date: '2025-04-08',
      in: '08:32',
      out: '17:45',
      shift: shiftSnapshot.hanhChinh,
    },
    {
      employee: engineer,
      date: '2025-04-09',
      in: '08:55',
      out: '17:20',
      shift: shiftSnapshot.hanhChinh,
      ghi_chu: 'Tac duong',
    },
    {
      employee: engineer,
      date: '2025-04-10',
      in: '09:05',
      out: '18:30',
      shift: shiftSnapshot.hanhChinh,
    },
    {
      employee: engineer,
      date: '2025-04-12',
      in: '08:40',
      out: '19:45',
      shift: shiftSnapshot.hanhChinh,
      ghi_chu: 'Lam cuoi tuan',
    },
    {
      employee: sales,
      date: '2025-04-08',
      in: '13:05',
      out: '21:15',
      shift: shiftSnapshot.caChieu,
    },
    {
      employee: sales,
      date: '2025-04-09',
      in: '13:20',
      out: '20:40',
      shift: shiftSnapshot.caChieu,
    },
    {
      employee: sales,
      date: '2025-04-10',
      in: '13:00',
      out: '19:30',
      shift: shiftSnapshot.caChieu,
      ghi_chu: 'Ve som de gap khach hang',
    },
    {
      employee: sales,
      date: '2025-04-12',
      in: '13:10',
      out: '22:10',
      shift: shiftSnapshot.caChieu,
    },
  ];

  for (const item of attendancePayload) {
    const payload = {
      nhan_vien_id: item.employee._id,
      ca_lam_viec_id: item.employee.thong_tin_cong_viec.ca_lam_viec_id,
      thoi_gian_vao: setTime(`${item.date}T00:00:00+07:00`, item.in),
      thoi_gian_ra: setTime(`${item.date}T00:00:00+07:00`, item.out),
      ngay: normalizeDay(`${item.date}T00:00:00+07:00`),
      ghi_chu: item.ghi_chu,
      shift_snapshot: item.shift,
    };
    await insertIfMissing(
      ChamCong,
      {nhan_vien_id: payload.nhan_vien_id, ngay: payload.ngay},
      payload,
    );
  }

  const overtimePayloads = [
    {
      nhan_vien_id: engineer._id,
      ngay: new Date('2025-04-12T00:00:00+07:00'),
      thoi_gian_bat_dau: setTime('2025-04-12T00:00:00+07:00', '17:30'),
      thoi_gian_ket_thuc: setTime('2025-04-12T00:00:00+07:00', '20:45'),
      so_gio: 3.25,
      loai_ngay: 'weekend',
      he_so: 2,
      trang_thai: 'Da duyet',
      nguoi_duyet_id: employees[1]._id,
      ly_do: 'Hoan thanh sprint',
    },
    {
      nhan_vien_id: sales._id,
      ngay: new Date('2025-04-12T00:00:00+07:00'),
      thoi_gian_bat_dau: setTime('2025-04-12T00:00:00+07:00', '21:00'),
      thoi_gian_ket_thuc: setTime('2025-04-12T00:00:00+07:00', '23:30'),
      so_gio: 2.5,
      loai_ngay: 'weekend_night',
      he_so: 2.3,
      trang_thai: 'Cho duyet',
      ly_do: 'Su kien ban hang',
    },
  ];
  for (const payload of overtimePayloads) {
    await insertIfMissing(
      OvertimeRequest,
      {
        nhan_vien_id: payload.nhan_vien_id,
        ngay: payload.ngay,
        thoi_gian_bat_dau: payload.thoi_gian_bat_dau,
      },
      payload,
    );
  }

  const timesheetWeek = normalizeDay('2025-04-07');
  const projects = await Project.find({});
  const hrmProject = projects.find((p) => p.ten === 'HRM Portal');
  const mobileProject = projects.find((p) => p.ten === 'ESS Mobile App');
  const activities = await Activity.find({project_id: {$in: [hrmProject._id, mobileProject._id]}})
    .lean();
  const activityLookup = Object.fromEntries(activities.map((a) => [a.ten, a]));
  const phanTich = activityLookup['Phan tich nghiep vu'];
  const phatTrien = activityLookup['Phat trien Web'];
  const thietKe = activityLookup['Thiet ke UI'];
  const kiemThu = activityLookup['Kiem thu'];

  const existingTimesheet = await Timesheet.findOne({
    nhan_vien_id: engineer._id,
    tuan_bat_dau: timesheetWeek,
  });
  if (!existingTimesheet) {
    await Timesheet.create({
      nhan_vien_id: engineer._id,
      tuan_bat_dau: timesheetWeek,
      trang_thai: 'Da duyet',
      nguoi_duyet_id: employees[1]._id,
      entries: [
        {
          ngay: new Date('2025-04-07T00:00:00+07:00'),
          project_id: hrmProject._id,
          activity_id: phanTich?._id,
          gio: 4,
          ghi_chu: 'Hop voi HR',
        },
        {
          ngay: new Date('2025-04-07T00:00:00+07:00'),
          project_id: hrmProject._id,
          activity_id: phatTrien?._id,
          gio: 4,
        },
        {
          ngay: new Date('2025-04-08T00:00:00+07:00'),
          project_id: hrmProject._id,
          activity_id: phatTrien?._id,
          gio: 8,
        },
        {
          ngay: new Date('2025-04-09T00:00:00+07:00'),
          project_id: mobileProject._id,
          activity_id: thietKe?._id,
          gio: 5,
        },
        {
          ngay: new Date('2025-04-09T00:00:00+07:00'),
          project_id: mobileProject._id,
          activity_id: kiemThu?._id,
          gio: 3,
        },
      ].filter((entry) => entry.activity_id),
    });
  }

  return {leaveRequests, engineer, sales, dateRange: {from: start, to: new Date('2025-04-12T00:00:00+07:00')}};
}

async function seedPayroll(employees, seedMeta) {
  const payrollEmployees = employees.slice(0, 4);
  const settings = {
    ti_le_bhxh: 0.08,
    ti_le_bhyt: 0.015,
    ti_le_bhtn: 0.01,
    ti_le_kpcd: 0.01,
    ap_dung_kpcd: true,
    giam_tru_ban_than: 11000000,
    giam_tru_phu_thuoc: 4400000,
  };

  const payrollEntries = payrollEmployees.map((emp, idx) => {
    const meta = seedMeta[idx];
    const baseSalary = meta.baseSalary;
    const allowances = meta.allowances.map((allow) => ({
      ten: allow.ten,
      so_tien: allow.so_tien,
    }));
    const otLine =
      idx === 2
        ? [{ten: 'OT cuoi tuan', so_tien: 650000}]
        : [];
    const bonusLine =
      idx === 3
        ? [{ten: 'Thuong doanh so', so_tien: 4000000}]
        : idx === 0
        ? [{ten: 'Thuong H1', so_tien: 6000000}]
        : [];
    const deductions =
      idx === 1
        ? [{ten: 'Tạm ứng', so_tien: 1000000}]
        : [];

    return calculatePayrollEntry(
      {
        nhan_vien_id: emp._id,
        ma_nhan_vien: emp.ma_nhan_vien,
        ho_ten: `${emp.ho_dem} ${emp.ten}`,
        luong_co_ban: baseSalary,
        phu_cap: allowances,
        thuong: bonusLine,
        ot: otLine,
        khoan_khau_tru: deductions,
        so_nguoi_phu_thuoc: emp.nguoi_phu_thuoc?.length || 0,
      },
      settings,
      {employee: emp},
    );
  });

  const totals = payrollEntries.reduce(
    (acc, entry) => {
      acc.employees += 1;
      acc.totalIncome += entry.tong_thu_nhap;
      acc.totalDeduction += entry.tong_khau_tru;
      acc.totalNet += entry.luong_thuc_nhan;
      acc.totalTax += entry.thue_tncn;
      return acc;
    },
    {employees: 0, totalIncome: 0, totalDeduction: 0, totalNet: 0, totalTax: 0},
  );

  const existingRun = await PayrollRun.findOne({ky_luong: 'Thang 04/2025'});
  if (!existingRun) {
    await PayrollRun.create({
      ky_luong: 'Thang 04/2025',
      loai_ky: 'Thang',
      ngay_bat_dau: new Date('2025-04-01T00:00:00+07:00'),
      ngay_ket_thuc: new Date('2025-04-30T00:00:00+07:00'),
      trang_thai: 'Da_chi',
      currency: 'VND',
      settings,
      entries: payrollEntries,
      tong_so_nhan_vien: totals.employees,
      tong_thu_nhap: totals.totalIncome,
      tong_khau_tru: totals.totalDeduction,
      tong_thue_tncn: totals.totalTax,
      tong_net: totals.totalNet,
      nguoi_tao_id: employees[1]._id,
      approved_by: employees[0]._id,
      approved_at: new Date(),
      locked_by: employees[0]._id,
      locked_at: new Date(),
    });
  }
}

async function seedDocumentsContracts(employees) {
  const documentPayloads = [
    {
      nhan_vien_id: employees[2]._id,
      folder: 'ho_so_lao_dong',
      tieu_de: 'Hop dong lao dong co thoi han',
      mo_ta: 'Ban hop dong ky ngay 01/01/2024',
      file_url: '/uploads/demo/hdld-nv102.pdf',
      file_type: 'application/pdf',
      file_size: 125000,
      ngay_hieu_luc: new Date('2024-01-01T00:00:00+07:00'),
      uploaded_by: employees[1]._id,
    },
    {
      nhan_vien_id: employees[2]._id,
      folder: 'ho_so_bhxh',
      tieu_de: 'So BHXH ban goc',
      file_url: '/uploads/demo/bhxh-nv102.pdf',
      file_type: 'application/pdf',
      file_size: 82000,
      uploaded_by: employees[1]._id,
    },
  ];
  for (const doc of documentPayloads) {
    await insertIfMissing(
      EmployeeDocument,
      {nhan_vien_id: doc.nhan_vien_id, tieu_de: doc.tieu_de},
      doc,
    );
  }

  const existingContract = await Contract.findOne({so_hop_dong: 'HD-2024-001'});
  if (!existingContract) {
    await Contract.create({
      nhan_vien_id: employees[2]._id,
      so_hop_dong: 'HD-2024-001',
      loai_hop_dong: 'Co_thoi_han',
      trang_thai: 'Da_ky',
      ngay_ky: new Date('2024-01-01T00:00:00+07:00'),
      hieu_luc_tu: new Date('2024-01-01T00:00:00+07:00'),
      hieu_luc_den: new Date('2026-01-01T00:00:00+07:00'),
      luong_co_ban: 25000000,
      phu_cap: [{ten: 'An trua', so_tien: 1200000}],
      file_url: '/uploads/demo/contracts/HD-2024-001.pdf',
      audit_log: [
        {
          action: 'create',
          user_id: employees[1]._id,
          ghi_chu: 'Tao contract',
        },
        {
          action: 'approve',
          user_id: employees[0]._id,
          ghi_chu: 'CEO phe duyet',
        },
      ],
      created_by: employees[1]._id,
      updated_by: employees[1]._id,
    });
  }
}

async function seedProfileAndConsent(users, employees) {
  const profileRequests = [
    {
      nhan_vien_id: employees[2]._id,
      type: 'contact',
      payload: {
        lien_he: {
          di_dong: '0908111222',
          email_khac: 'khoa.personal@example.com',
        },
        dia_chi: {
          duong_so_1: '45 Nguyen Binh Khiem',
          thanh_pho: 'TPHCM',
        },
      },
      note: 'Cap nhat dia chi moi',
      status: 'Pending',
    },
    {
      nhan_vien_id: employees[3]._id,
      type: 'dependents',
      payload: {
        action: 'add',
        dependent: {
          ten: 'Pham Bao Minh',
          moi_quan_he: 'Con',
          ngay_sinh: new Date('2021-09-09'),
        },
      },
      note: 'Them nguoi phu thuoc',
      status: 'Approved',
      approver_note: 'Da cap nhat tren he thong',
      reviewed_by: employees[1]._id,
      reviewed_at: new Date(),
    },
  ];
  for (const req of profileRequests) {
    await insertIfMissing(
      ProfileRequest,
      {nhan_vien_id: req.nhan_vien_id, type: req.type, note: req.note},
      req,
    );
  }

  const purposes = consentPurposes.map((p) => p.key);
  for (let idx = 0; idx < users.length; idx += 1) {
    const user = users[idx];
    for (const purpose of purposes) {
      const accepted = !(idx === 2 && purpose === 'internal_comms');
      await Consent.findOneAndUpdate(
        {user_id: user._id, purpose},
        {
          $set: {
            nhan_vien_id: user.nhan_vien_id,
            status: accepted ? 'Accepted' : 'Withdrawn',
            note: accepted ? undefined : 'Khong muon nhan ban tin noi bo',
            granted_at: accepted ? new Date() : undefined,
            withdrawn_at: accepted ? undefined : new Date(),
          },
          $push: {
            history: {
              status: accepted ? 'Accepted' : 'Withdrawn',
              acted_at: new Date(),
              actor_id: user._id,
            },
          },
        },
        {upsert: true, setDefaultsOnInsert: true},
      );
    }
  }
}

async function seedCompliance(employees) {
  const complianceLogs = [
    {
      type: '01PLI',
      report_name: 'Bao cao 01/PLI',
      requested_by: employees[1]._id,
      params: {from_date: '2025-01-01', to_date: '2025-06-30'},
      total_rows: 5,
      format: 'csv',
      exported_at: new Date('2025-06-05T08:00:00+07:00'),
    },
    {
      type: 'D02TS',
      report_name: 'Bao cao D02-TS',
      requested_by: employees[1]._id,
      params: {from_date: '2025-04-01', to_date: '2025-04-30'},
      total_rows: 4,
      format: 'csv',
      exported_at: new Date('2025-05-02T09:15:00+07:00'),
    },
  ];
  for (const log of complianceLogs) {
    const exists = await ComplianceReportLog.findOne({
      type: log.type,
      'params.from_date': log.params.from_date,
      'params.to_date': log.params.to_date,
    });
    if (!exists) {
      await ComplianceReportLog.create(log);
    }
  }

  const reminderLogs = [
    {
      report_id: 'D02TS',
      report_name: 'Thong bao bien dong lao dong BHXH',
      period_key: 'D02TS-2025-05-02',
      sent_at: new Date('2025-05-01T08:00:00+07:00'),
      due_date: new Date('2025-05-02T00:00:00+07:00'),
      manual: false,
    },
    {
      report_id: '01PLI',
      report_name: 'Bao cao 01/PLI',
      period_key: '01PLI-2025-H1',
      sent_at: new Date(),
      due_date: new Date('2025-06-05T00:00:00+07:00'),
      manual: true,
      manual_by: employees[1]._id,
      notes: 'Da gui email toi So LDTBXH',
    },
  ];
  for (const reminder of reminderLogs) {
    await ComplianceReminderLog.findOneAndUpdate(
      {report_id: reminder.report_id, period_key: reminder.period_key},
      {$setOnInsert: reminder},
      {upsert: true},
    );
  }
}

async function seedOffboarding(users, employees) {
  const existingOffboarding = await Offboarding.findOne({
    nhan_vien_id: employees[5]._id,
  });
  if (!existingOffboarding) {
    await Offboarding.create({
      nhan_vien_id: employees[5]._id,
      reason: 'Ket thuc ky thuc tap',
      last_working_day: new Date('2025-05-31T00:00:00+07:00'),
      status: 'InProgress',
      requested_by: users[1]._id,
      approved_by: users[0]._id,
      tasks: [
        {
          name: 'Ban giao tai san',
          department: 'IT',
          assigned_to: employees[1]._id,
          status: 'Pending',
          due_date: new Date('2025-05-25T00:00:00+07:00'),
        },
        {
          name: 'Tinh luong cuoi cung',
          department: 'Finance',
          assigned_to: employees[4]._id,
          status: 'InProgress',
          due_date: new Date('2025-05-28T00:00:00+07:00'),
        },
      ],
    });
  }
}

async function recalcTimeSheets(employees, dateRange) {
  await timeRuleEngine.recalcRange({
    employees,
    from: dateRange.from,
    to: dateRange.to,
  });
}

async function seedDemoData() {
  console.log('🔄 Dang ket noi MongoDB...');
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Hung-qlns';
  await mongoose.connect(MONGO_URI);
  console.log('✅ Ket noi thanh cong.\n');

  if (appendMode) {
    console.log('➕ Append mode: GIU nguyen du lieu cu, chi them demo moi.\n');
  } else {
    console.log('🧹 Xoa du lieu cu...');
    await clearCollections();
    console.log('✅ Da lam sach database.\n');
  }

  console.log('📚 Seed du lieu tham chieu...');
  const lookups = await seedLookups();
  console.log('✅ Da tao phong ban, chuc danh, ca lam viec.\n');

  console.log('👥 Seed nhan vien & tai khoan dang nhap...');
  const {employees, users, seedMeta} = await seedEmployees(lookups);
  console.log('✅ Da tao 6 nhan vien & 3 tai khoan dang nhap.\n');

  console.log('🕒 Seed du lieu cham cong, nghi phep, OT, timesheet...');
  const timeData = await seedLeaveAndTimeData(lookups, employees);
  console.log('✅ Du lieu cham cong mau san sang.\n');

  console.log('💰 Seed bang luong mau...');
  await seedPayroll(employees, seedMeta);
  console.log('✅ Bang luong Thang 04/2025 da tao.\n');

  console.log('📄 Seed ho so, hop dong...');
  await seedDocumentsContracts(employees);
  console.log('✅ Ho so & hop dong mau da chin.\n');

  console.log('🙋 Seed yeu cau ho so & consent...');
  await seedProfileAndConsent(users, employees);
  console.log('✅ Consent va yeu cau cap nhat ho so san sang.\n');

  console.log('📊 Seed bao cao tuan thu & offboarding...');
  await seedCompliance(employees);
  await seedOffboarding(users, employees);
  console.log('✅ Bao cao va offboarding demo da tao.\n');

  console.log('🧠 Tinh toan rule engine cho khoang ngay mau...');
  await recalcTimeSheets(employees, timeData.dateRange);
  const summaries = await DailyTimeSummary.countDocuments({});
  console.log(`✅ Da tinh ${summaries} ban ghi daily_time_summaries.\n`);

  console.log('🎉 Hoan tat seed demo data!');
  console.log('--------------------------------------------');
  console.log('Tai khoan dang nhap thu nghiem:');
  console.log('  Admin  : ceo@demo-hutech.vn / 123456');
  console.log('  Manager: hr@demo-hutech.vn / 123456');
  console.log('  Employee: engineer@demo-hutech.vn / 123456');
  console.log('Chay lai seed: npm run seed:demo (tai backend)');
  console.log('--------------------------------------------');

  await mongoose.disconnect();
  process.exit(0);
}

seedDemoData().catch((err) => {
  console.error('❌ Loi seed demo data:', err);
  mongoose.disconnect();
  process.exit(1);
});
