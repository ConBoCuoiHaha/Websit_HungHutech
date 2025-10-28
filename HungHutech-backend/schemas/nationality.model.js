const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NationalitySchema = new Schema({
  ten_quoc_tich: {
    type: String,
    required: true,
    trim: true
  },
  ma_quoc_gia: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 3
  },
  kich_hoat: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'nationalities'
});

// Index cho tìm kiếm
NationalitySchema.index({ ten_quoc_tich: 1 });
NationalitySchema.index({ ma_quoc_gia: 1 });
NationalitySchema.index({ kich_hoat: 1 });

module.exports = mongoose.model('Nationality', NationalitySchema);
