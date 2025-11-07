const Site = require('../schemas/site.model');
const { parseListParams, buildSort } = require('../utils/pagination');

// Tạo siteId tự động (format: SITE-001, SITE-002, ...)
async function generateSiteId() {
  const lastSite = await Site.findOne({ siteId: /^SITE-/ })
    .sort({ siteId: -1 })
    .select('siteId');

  if (!lastSite) {
    return 'SITE-001';
  }

  const lastNumber = parseInt(lastSite.siteId.split('-')[1]);
  const newNumber = (lastNumber + 1).toString().padStart(3, '0');
  return `SITE-${newNumber}`;
}

// GET /api/sites - Lấy danh sách địa điểm (Admin/Manager)
exports.getAll = async (req, res) => {
  try {
    const { limit, skip, page, sort } = parseListParams(req.query);
    const filter = { da_xoa: false };

    // Filter theo trạng thái
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    // Search theo tên hoặc địa chỉ
    if (req.query.q) {
      filter.$or = [
        { name: { $regex: req.query.q, $options: 'i' } },
        { address: { $regex: req.query.q, $options: 'i' } },
        { siteId: { $regex: req.query.q, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Site.find(filter)
        .populate('createdBy', 'username')
        .populate('updatedBy', 'username')
        .sort(buildSort(sort || '-createdAt'))
        .skip(skip)
        .limit(limit),
      Site.countDocuments(filter),
    ]);

    res.json({
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error in getAll sites:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// GET /api/sites/:id - Lấy chi tiết một địa điểm
exports.getById = async (req, res) => {
  try {
    const item = await Site.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    if (!item || item.da_xoa) {
      return res.status(404).json({ msg: 'Không tìm thấy địa điểm' });
    }

    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy địa điểm' });
    }
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// POST /api/sites - Tạo địa điểm mới (Admin only)
exports.create = async (req, res) => {
  try {
    const { name, address, longitude, latitude, radius, isActive } = req.body;

    // Tạo siteId tự động
    const siteId = await generateSiteId();

    const siteData = {
      siteId,
      name,
      address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      radius: radius || 150,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user?.userId,
    };

    const doc = await Site.create(siteData);

    const populatedDoc = await Site.findById(doc._id).populate('createdBy', 'username');

    res.status(201).json(populatedDoc);
  } catch (err) {
    console.error('Error creating site:', err);

    // Xử lý lỗi duplicate key
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Site ID đã tồn tại' });
    }

    // Xử lý validation error
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ msg: messages.join(', ') });
    }

    res.status(400).json({ msg: 'Không thể tạo địa điểm', error: err.message });
  }
};

// PUT /api/sites/:id - Cập nhật địa điểm (Admin only)
exports.update = async (req, res) => {
  try {
    const { name, address, longitude, latitude, radius, isActive } = req.body;

    const updateData = {
      updatedBy: req.user?.userId,
    };

    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (radius !== undefined) updateData.radius = radius;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Cập nhật location nếu có longitude/latitude
    if (longitude !== undefined && latitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    const item = await Site.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    if (!item || item.da_xoa) {
      return res.status(404).json({ msg: 'Không tìm thấy địa điểm' });
    }

    res.json(item);
  } catch (err) {
    console.error('Error updating site:', err);

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ msg: messages.join(', ') });
    }

    res.status(400).json({ msg: 'Không thể cập nhật địa điểm', error: err.message });
  }
};

// DELETE /api/sites/:id - Xóa địa điểm (Soft delete - Admin only)
exports.delete = async (req, res) => {
  try {
    const item = await Site.findByIdAndUpdate(
      req.params.id,
      { da_xoa: true, updatedBy: req.user?.userId },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ msg: 'Không tìm thấy địa điểm' });
    }

    res.json({ msg: 'Địa điểm đã được xóa thành công' });
  } catch (err) {
    console.error('Error deleting site:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// PATCH /api/sites/:id/toggle - Bật/Tắt địa điểm (Admin only)
exports.toggleActive = async (req, res) => {
  try {
    const item = await Site.findById(req.params.id);

    if (!item || item.da_xoa) {
      return res.status(404).json({ msg: 'Không tìm thấy địa điểm' });
    }

    item.isActive = !item.isActive;
    item.updatedBy = req.user?.userId;
    await item.save();

    res.json({
      msg: `Địa điểm đã được ${item.isActive ? 'kích hoạt' : 'vô hiệu hóa'}`,
      isActive: item.isActive,
    });
  } catch (err) {
    console.error('Error toggling site:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// GET /api/sites/nearby - Tìm địa điểm gần nhất (dùng geospatial query)
exports.getNearby = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ msg: 'Thiếu tọa độ longitude/latitude' });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxDist = maxDistance ? parseInt(maxDistance) : 5000; // Default 5km

    const sites = await Site.find({
      da_xoa: false,
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: maxDist, // meters
        },
      },
    }).limit(10);

    // Tính khoảng cách chính xác cho từng site
    const sitesWithDistance = sites.map((site) => {
      const distance = calculateDistance(lat, lng, site.latitude, site.longitude);
      return {
        ...site.toObject(),
        distance: Math.round(distance), // meters
        isInRange: distance <= site.radius,
      };
    });

    res.json({
      data: sitesWithDistance,
      total: sitesWithDistance.length,
    });
  } catch (err) {
    console.error('Error in getNearby:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// Helper function: Tính khoảng cách giữa 2 điểm GPS (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
