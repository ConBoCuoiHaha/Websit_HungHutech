const mongoose = require('mongoose');
const { Schema } = mongoose;

const TimesheetEntrySchema = new Schema(
  {
    ngay: { type: Date, required: true },
    project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    activity_id: { type: Schema.Types.ObjectId, ref: 'Activity', required: true },
    gio: { type: Number, required: true, min: 0, max: 24 },
    ghi_chu: { type: String },
  },
  { _id: false }
);

const TimesheetSchema = new Schema(
  {
    nhan_vien_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    tuan_bat_dau: { type: Date, required: true }, // ngày thứ 2 của tuần hoặc chuẩn bạn chọn
    trang_thai: { type: String, enum: ['Cho duyet', 'Da duyet', 'Bi tu choi'], default: 'Cho duyet' },
    entries: { type: [TimesheetEntrySchema], default: [] },
    nguoi_duyet_id: { type: Schema.Types.ObjectId, ref: 'NhanVien' },
    ghi_chu_quan_ly: { type: String },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

TimesheetSchema.index({ nhan_vien_id: 1, tuan_bat_dau: 1 }, { unique: true });

const Timesheet = mongoose.model('Timesheet', TimesheetSchema, 'timesheets');
module.exports = Timesheet;

