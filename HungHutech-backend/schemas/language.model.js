const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LanguageSchema = new Schema({
  ten_ngon_ngu: {
    type: String,
    required: true,
    trim: true
  },
  ma_ngon_ngu: {
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
  collection: 'languages'
});

// Index cho tìm kiếm
LanguageSchema.index({ ten_ngon_ngu: 1 });
LanguageSchema.index({ ma_ngon_ngu: 1 });
LanguageSchema.index({ kich_hoat: 1 });

module.exports = mongoose.model('Language', LanguageSchema);
