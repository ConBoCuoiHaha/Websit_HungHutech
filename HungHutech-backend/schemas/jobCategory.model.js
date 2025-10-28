const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobCategorySchema = new Schema({
  ten_danh_muc: {
    type: String,
    required: true,
    trim: true
  },
  mo_ta: {
    type: String,
    trim: true
  },
  kich_hoat: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'job_categories'
});

// Index cho tìm kiếm
JobCategorySchema.index({ ten_danh_muc: 1 });
JobCategorySchema.index({ kich_hoat: 1 });

module.exports = mongoose.model('JobCategory', JobCategorySchema);
