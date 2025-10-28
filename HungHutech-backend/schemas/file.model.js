const mongoose = require('mongoose');
const { Schema } = mongoose;

const FileSchema = new Schema(
  {
    path: { type: String, required: true },
    original_name: { type: String, required: true },
    mime_type: { type: String, required: true },
    size: { type: Number, required: true },
    owner_type: { type: String, required: true }, // e.g., 'NhanVien', 'YeuCauNghiPhep'
    owner_id: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

const FileObject = mongoose.model('FileObject', FileSchema, 'files');
module.exports = FileObject;

