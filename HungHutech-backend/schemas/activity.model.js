const mongoose = require('mongoose');
const { Schema } = mongoose;

const ActivitySchema = new Schema(
  {
    project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    ten: { type: String, required: true, trim: true },
    // Mo ta hoat dong (optional)
    mo_ta: { type: String },
    // Trang thai hoat dong (frontend dang su dung cac gia tri tieng Viet)
    // Khong rang buoc enum de tranh loi do ma hoa ky tu, chi dat gia tri mac dinh
    trang_thai: { type: String, default: 'Dang hoat dong' },
    kich_hoat: { type: Boolean, default: true },
    da_xoa: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

ActivitySchema.index({ project_id: 1, ten: 1 }, { unique: true });

const Activity = mongoose.model('Activity', ActivitySchema, 'activities');
module.exports = Activity;
