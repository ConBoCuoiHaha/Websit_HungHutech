const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SkillSchema = new Schema({
  ten_ky_nang: {
    type: String,
    required: true,
    trim: true
  },
  mo_ta: {
    type: String,
    trim: true
  },
  loai_ky_nang: {
    type: String,
    enum: ['Kỹ thuật', 'Quản lý', 'Giao tiếp', 'Ngoại ngữ', 'Khác'],
    default: 'Khác'
  },
  kich_hoat: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'skills'
});

// Index cho tìm kiếm
SkillSchema.index({ ten_ky_nang: 1 });
SkillSchema.index({ loai_ky_nang: 1 });
SkillSchema.index({ kich_hoat: 1 });

module.exports = mongoose.model('Skill', SkillSchema);
