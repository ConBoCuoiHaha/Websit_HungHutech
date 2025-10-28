const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EducationLevelSchema = new Schema({
  ten_trinh_do: {
    type: String,
    required: true,
    trim: true
  },
  mo_ta: {
    type: String,
    trim: true
  },
  cap_do: {
    type: Number,
    default: 0,
    min: 0
  },
  kich_hoat: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'education_levels'
});

// Index cho tìm kiếm
EducationLevelSchema.index({ ten_trinh_do: 1 });
EducationLevelSchema.index({ cap_do: 1 });
EducationLevelSchema.index({ kich_hoat: 1 });

module.exports = mongoose.model('EducationLevel', EducationLevelSchema);
