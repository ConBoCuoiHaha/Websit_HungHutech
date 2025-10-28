const PhongBan = require('../schemas/phongBan.model.js');

exports.createPhongBan = async (req, res) => {
  try {
    const phongBanMoi = new PhongBan(req.body);
    await phongBanMoi.save();
    res.status(201).json(phongBanMoi);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo phòng ban', error: err.message });
  }
};

const {parseListParams, buildSort, buildSearchQuery} = require('../utils/pagination');

exports.getAllPhongBan = async (req, res) => {
  try {
    const {limit, skip, q, sort, page} = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, ['ten', 'mo_ta']) };
    const [items, total] = await Promise.all([
      PhongBan.find(filter)
        .populate('quan_ly_id', 'ho_dem ten ma_nhan_vien')
        .sort(buildSort(sort))
        .skip(skip)
        .limit(limit),
      PhongBan.countDocuments(filter),
    ]);
    res.json({ data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};

exports.getPhongBanById = async (req, res) => {
  try {
    const phongBan = await PhongBan.findById(req.params.id);
    if (!phongBan || phongBan.da_xoa) {
      return res.status(404).json({ msg: 'Không tìm thấy phòng ban' });
    }
    res.json(phongBan);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy phòng ban' });
    }
    res.status(500).send('Lỗi máy chủ');
  }
};

exports.updatePhongBan = async (req, res) => {
  try {
    const updateData = {...req.body};

    // Handle empty string for quan_ly_id (remove manager)
    if (updateData.quan_ly_id === '' || updateData.quan_ly_id === null) {
      updateData.quan_ly_id = null;
    }
    // Handle populated quan_ly_id object
    if (updateData.quan_ly_id && typeof updateData.quan_ly_id === 'object' && updateData.quan_ly_id._id) {
      updateData.quan_ly_id = updateData.quan_ly_id._id;
    }

    const phongBan = await PhongBan.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!phongBan) {
      return res.status(404).json({ msg: 'Không tìm thấy phòng ban' });
    }
    res.json(phongBan);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

exports.deletePhongBan = async (req, res) => {
  try {
    const phongBan = await PhongBan.findByIdAndUpdate(
      req.params.id,
      { da_xoa: true },
      { new: true }
    );
    if (!phongBan) {
      return res.status(404).json({ msg: 'Không tìm thấy phòng ban' });
    }
    res.json({ msg: 'Phòng ban đã được xóa thành công' });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};
