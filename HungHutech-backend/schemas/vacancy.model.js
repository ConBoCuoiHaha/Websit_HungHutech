const mongoose = require('mongoose');
const { Schema } = mongoose;

const VacancySchema = new Schema(
  {
    tieu_de: { type: String, required: true, trim: true },
    mo_ta: { type: String },
    hiring_manager_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    trang_thai: { type: String, enum: ['Mo', 'Dong'], default: 'Mo' },
    dia_diem_id: { type: Schema.Types.ObjectId, ref: 'DiaDiem', default: null },
    da_xoa: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

const Vacancy = mongoose.model('Vacancy', VacancySchema, 'vacancies');
module.exports = Vacancy;

