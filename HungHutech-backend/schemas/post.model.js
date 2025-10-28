const mongoose = require('mongoose');
const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    tac_gia_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    noi_dung: { type: String, required: true },
    hinh_anh_file_ids: { type: [Schema.Types.ObjectId], default: [] },
    luot_thich: { type: Number, default: 0 },
    da_xoa: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

const Post = mongoose.model('Post', PostSchema, 'posts');
module.exports = Post;

