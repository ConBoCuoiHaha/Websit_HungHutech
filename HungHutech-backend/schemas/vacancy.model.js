const mongoose = require('mongoose');
const {Schema} = mongoose;

const VacancyChannelSchema = new Schema(
  {
    channel_key: {type: String, required: true},
    channel_name: {type: String, required: true},
    trang_thai: {
      type: String,
      enum: ['Cho dang', 'Dang dang', 'Thanh cong', 'That bai'],
      default: 'Cho dang',
    },
    posted_url: String,
    reference_code: String,
    posted_at: Date,
    error_message: String,
  },
  {_id: false},
);

const VacancySchema = new Schema(
  {
    tieu_de: {type: String, required: true, trim: true},
    mo_ta: {type: String},
    yeu_cau: {type: String},
    so_luong: {type: Number, default: 1},
    muc_luong: {type: String},
    ky_nang: {type: [String], default: []},
    nganh_nghe: {type: String},
    han_nop: {type: Date},
    hiring_manager_id: {type: Schema.Types.ObjectId, ref: 'NhanVien', required: true},
    trang_thai: {type: String, enum: ['Mo', 'Dong'], default: 'Mo'},
    dia_diem_id: {type: Schema.Types.ObjectId, ref: 'DiaDiem', default: null},
    channels: {type: [VacancyChannelSchema], default: []},
    da_xoa: {type: Boolean, default: false},
  },
  {timestamps: {createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat'}},
);

VacancySchema.index({trang_thai: 1});
VacancySchema.index({han_nop: 1});

const Vacancy = mongoose.model('Vacancy', VacancySchema, 'vacancies');
module.exports = Vacancy;
