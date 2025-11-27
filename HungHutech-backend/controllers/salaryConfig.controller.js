const SalaryConfig = require('../schemas/salaryConfig.model');

// Giá trị mặc định theo biểu mẫu đã cung cấp
const DEFAULT_CONFIG = {
  muc_luong_bat_dau_tinh_tncn: 9000000,
  giam_tru_phu_thuoc: 3600000,
  lam_tron_luong_thuc_linh: -3,
  luong_co_ban_bhxh_bhyt: 1300000,
  luong_toi_thieu_vung_bhtn: 3980000,
  khong_tinh_bhxh_bhyt_neu_ngay_cong_duoi: 5,
  ti_le_dn: { bhxh: 18, bhyt: 3, bhtn: 1, kpcd: 0, tien: 0 },
  ti_le_nld: { bhxh: 8, bhyt: 1.5, bhtn: 1, kpcd: 0, tien: 50000 },
  thue_tncn_bac: {
    bac5: 5000000,
    bac10: 10000000,
    bac15: 18000000,
    bac20: 32000000,
    bac25: 52000000,
    bac30: 80000000,
    bac35: 1000000000,
  },
};

// Đảm bảo chỉ tồn tại một bản cấu hình, tạo mặc định nếu chưa có
const ensureSingleton = async () => {
  let config = await SalaryConfig.findOne();
  if (!config) {
    config = await SalaryConfig.create(DEFAULT_CONFIG);
  }
  return config;
};

exports.get = async (req, res) => {
  try {
    const config = await ensureSingleton();
    res.json(config);
  } catch (err) {
    console.error('salaryConfig.get error', err);
    res.status(500).json({ msg: 'Lỗi khi lấy cấu hình thu nhập' });
  }
};

exports.update = async (req, res) => {
  try {
    const config = await ensureSingleton();
    Object.assign(config, req.body || {}, { updatedBy: req.user?._id });
    await config.save();
    res.json(config);
  } catch (err) {
    console.error('salaryConfig.update error', err);
    res.status(500).json({ msg: 'Lỗi khi cập nhật cấu hình thu nhập' });
  }
};
