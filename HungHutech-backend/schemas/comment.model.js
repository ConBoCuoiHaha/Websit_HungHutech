const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema(
  {
    post_id: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    tac_gia_id: { type: Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    noi_dung: { type: String, required: true },
  },
  { timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' } }
);

const Comment = mongoose.model('Comment', CommentSchema, 'comments');
module.exports = Comment;

