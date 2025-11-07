const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const { auth: authenticate } = require('../../middlewares/auth');
const { handleValidation } = require('../../middlewares/validate');
const Site = require('../../schemas/site.model');

// Tất cả routes cần authentication
router.use(authenticate);

// GET /api/mobile/sites/active - Lấy danh sách địa điểm đang hoạt động
router.get('/active', async (req, res) => {
  try {
    const sites = await Site.find({ da_xoa: false, isActive: true }).select(
      'siteId name address location radius'
    );

    res.json({
      success: true,
      data: sites,
      total: sites.length,
    });
  } catch (err) {
    console.error('Error in mobile/sites/active:', err);
    res.status(500).json({ success: false, msg: 'Lỗi máy chủ', error: err.message });
  }
});

// GET /api/mobile/sites/nearest - Tìm địa điểm gần nhất
router.get(
  '/nearest',
  [
    query('longitude').notEmpty().isFloat({ min: -180, max: 180 }).withMessage('Longitude không hợp lệ'),
    query('latitude').notEmpty().isFloat({ min: -90, max: 90 }).withMessage('Latitude không hợp lệ'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { longitude, latitude } = req.query;
      const lng = parseFloat(longitude);
      const lat = parseFloat(latitude);

      // Tìm các sites gần nhất (trong bán kính 10km)
      const sites = await Site.find({
        da_xoa: false,
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: 10000, // 10km
          },
        },
      })
        .select('siteId name address location radius')
        .limit(5);

      // Tính khoảng cách chính xác
      const sitesWithDistance = sites.map((site) => {
        const distance = calculateDistance(lat, lng, site.latitude, site.longitude);
        return {
          ...site.toObject(),
          distance: Math.round(distance), // meters
          isInRange: distance <= site.radius,
          canCheckIn: distance <= site.radius, // Cho phép check-in nếu trong bán kính
        };
      });

      // Tìm site gần nhất
      const nearest = sitesWithDistance.length > 0 ? sitesWithDistance[0] : null;

      res.json({
        success: true,
        nearest,
        allSites: sitesWithDistance,
        total: sitesWithDistance.length,
      });
    } catch (err) {
      console.error('Error in mobile/sites/nearest:', err);
      res.status(500).json({ success: false, msg: 'Lỗi máy chủ', error: err.message });
    }
  }
);

// Helper: Tính khoảng cách Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

module.exports = router;
