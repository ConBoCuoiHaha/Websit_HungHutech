const mongoose = require('mongoose');

const { Schema } = mongoose;

const EmployeeDocumentSchema = new Schema(
  {
    nhan_vien_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    folder: {
      type: String,
      enum: ['ho_so_lao_dong', 'ho_so_bhxh', 'ho_so_noi_bo', 'ho_so_phap_ly'],
      required: true,
    },
    tieu_de: { type: String, required: true },
    mo_ta: String,
    file_url: { type: String, required: true },
    file_id: { type: Schema.Types.ObjectId, ref: 'File' },
    file_type: String,
    file_size: Number,
    ngay_hieu_luc: Date,
    ngay_het_han: Date,
    metadata: Schema.Types.Mixed,
    uploaded_by: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
  },
  {
    timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' },
  },
);

EmployeeDocumentSchema.index({ nhan_vien_id: 1, folder: 1, tieu_de: 1 });

const EmployeeDocument = mongoose.model(
  'EmployeeDocument',
  EmployeeDocumentSchema,
  'employee_documents',
);

module.exports = EmployeeDocument;
