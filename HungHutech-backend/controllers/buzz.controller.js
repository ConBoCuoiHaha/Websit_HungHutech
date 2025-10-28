const Post = require('../schemas/post.model');
const Comment = require('../schemas/comment.model');
const { parseListParams, buildSort, buildSearchQuery } = require('../utils/pagination');

exports.createPost = async (req, res) => {
  try {
    const doc = await Post.create({ ...req.body, tac_gia_id: req.user.nhan_vien_id || req.body.tac_gia_id });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo bài viết', error: err.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const { limit, skip, q, sort, page } = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, ['noi_dung']) };
    const [items, total] = await Promise.all([
      Post.find(filter).populate('tac_gia_id', 'ho_dem ten').sort(buildSort(sort) || '-ngay_tao').skip(skip).limit(limit),
      Post.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { luot_thich: 1 } }, { new: true });
    if (!post) return res.status(404).json({ msg: 'Không tìm thấy bài viết' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

exports.commentPost = async (req, res) => {
  try {
    const comment = await Comment.create({ post_id: req.params.id, tac_gia_id: req.user.nhan_vien_id || req.body.tac_gia_id, noi_dung: req.body.noi_dung });
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể bình luận', error: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { limit, skip, page } = parseListParams(req.query);
    const [items, total] = await Promise.all([
      Comment.find({ post_id: req.params.id }).populate('tac_gia_id', 'ho_dem ten').sort('-ngay_tao').skip(skip).limit(limit),
      Comment.countDocuments({ post_id: req.params.id }),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

