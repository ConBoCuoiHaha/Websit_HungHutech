const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const NhanVien = require('../schemas/nhanVien.model');
const { parseListParams, buildSearchQuery, buildSort } = require('../utils/pagination');

router.get('/employees', [query('q').optional().isString()], handleValidation, async (req, res) => {
  try {
    const { limit, skip, q, sort, page } = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, ['ma_nhan_vien','ho_dem','ten','lien_he.email_cong_viec']) };
    const [items, total] = await Promise.all([
      NhanVien.find(filter)
        .select('ma_nhan_vien ho_dem ten lien_he.email_cong_viec thong_tin_cong_viec.chuc_danh_id')
        .populate('thong_tin_cong_viec.chuc_danh_id', 'ten_chuc_danh')
        .sort(buildSort(sort) || 'ten')
        .skip(skip)
        .limit(limit),
      NhanVien.countDocuments(filter),
    ]);
    res.json({
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
});

module.exports = router;

