const mongoose = require('mongoose');
const { Schema } = mongoose;

const KpiSchema = new Schema(
  {
    ten: { type: String, required: true },
    mo_ta: { type: String },
    trong_so: { type: Number, min: 0, max: 100, default: 0 },
    kich_hoat: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

const KPI = mongoose.model('KPI', KpiSchema, 'kpis');
module.exports = KPI;

