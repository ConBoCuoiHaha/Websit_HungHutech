const express = require('express');
const router = express.Router();
const NgayLe = require('../schemas/ngayLe.model');

// Get all holidays
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by year
    if (req.query.nam) {
      const year = parseInt(req.query.nam);
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      query.ngay = { $gte: startDate, $lte: endDate };
    }

    // Filter by status
    if (req.query.trang_thai) {
      query.trang_thai = req.query.trang_thai;
    }

    const total = await NgayLe.countDocuments(query);
    const items = await NgayLe.find(query)
      .sort({ ngay: 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get holiday by ID
router.get('/:id', async (req, res, next) => {
  try {
    const holiday = await NgayLe.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ msg: 'Không tìm thấy ngày lễ' });
    }
    res.json(holiday);
  } catch (err) {
    next(err);
  }
});

// Create holiday
router.post('/', async (req, res, next) => {
  try {
    const holiday = new NgayLe(req.body);
    await holiday.save();
    res.status(201).json(holiday);
  } catch (err) {
    next(err);
  }
});

// Update holiday
router.put('/:id', async (req, res, next) => {
  try {
    const holiday = await NgayLe.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!holiday) {
      return res.status(404).json({ msg: 'Không tìm thấy ngày lễ' });
    }
    res.json(holiday);
  } catch (err) {
    next(err);
  }
});

// Delete holiday
router.delete('/:id', async (req, res, next) => {
  try {
    const holiday = await NgayLe.findByIdAndDelete(req.params.id);
    if (!holiday) {
      return res.status(404).json({ msg: 'Không tìm thấy ngày lễ' });
    }
    res.json({ msg: 'Xóa ngày lễ thành công' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
