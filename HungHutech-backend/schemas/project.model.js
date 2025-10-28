const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectSchema = new Schema(
  {
    ten: { type: String, required: true, unique: true, trim: true },
    khach_hang: { type: String }, // Customer name
    mo_ta: { type: String }, // Description
    trang_thai: { type: String, enum: ['Hoạt động', 'Tạm dừng', 'Hoàn thành'], default: 'Hoạt động' }, // Status
    kich_hoat: { type: Boolean, default: true },
    da_xoa: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

const Project = mongoose.model('Project', ProjectSchema, 'projects');
module.exports = Project;

