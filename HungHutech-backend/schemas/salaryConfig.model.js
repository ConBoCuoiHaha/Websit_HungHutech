const mongoose = require('mongoose');

const SalaryConfigSchema = new mongoose.Schema(
  {
    // Ngưỡng, giảm trừ, làm tròn
    muc_luong_bat_dau_tinh_tncn: {type: Number, default: 0},
    giam_tru_phu_thuoc: {type: Number, default: 0},
    lam_tron_luong_thuc_linh: {type: Number, default: 0},
    luong_co_ban_bhxh_bhyt: {type: Number, default: 0},
    luong_toi_thieu_vung_bhtn: {type: Number, default: 0},
    khong_tinh_bhxh_bhyt_neu_ngay_cong_duoi: {type: Number, default: 0},

    // Tỷ lệ Doanh nghiệp
    ti_le_dn: {
      bhxh: {type: Number, default: 0},
      bhyt: {type: Number, default: 0},
      bhtn: {type: Number, default: 0},
      kpcd: {type: Number, default: 0},
      tien: {type: Number, default: 0},
    },
    // Tỷ lệ Người lao động
    ti_le_nld: {
      bhxh: {type: Number, default: 0},
      bhyt: {type: Number, default: 0},
      bhtn: {type: Number, default: 0},
      kpcd: {type: Number, default: 0},
      tien: {type: Number, default: 0},
    },

    // Biểu thuế TNCN
    thue_tncn_bac: {
      bac5: {type: Number, default: 0},
      bac10: {type: Number, default: 0},
      bac15: {type: Number, default: 0},
      bac20: {type: Number, default: 0},
      bac25: {type: Number, default: 0},
      bac30: {type: Number, default: 0},
      bac35: {type: Number, default: 0},
    },

    updatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  },
  {timestamps: true},
);

module.exports = mongoose.model('SalaryConfig', SalaryConfigSchema);
