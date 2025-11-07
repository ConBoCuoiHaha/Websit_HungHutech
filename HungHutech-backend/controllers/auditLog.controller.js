const AuditLog = require('../schemas/auditLog.model');
const { parseListParams, buildSort } = require('../utils/pagination');

// GET /api/audit-logs - Lấy lịch sử truy cập (Admin only)
exports.getAll = async (req, res) => {
  try {
    const { limit, skip, page, sort } = parseListParams(req.query);
    const filter = {};

    // Filter theo userId
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    // Filter theo username
    if (req.query.username) {
      filter.username = { $regex: req.query.username, $options: 'i' };
    }

    // Filter theo action
    if (req.query.action) {
      filter.action = req.query.action;
    }

    // Filter theo resource
    if (req.query.resource) {
      filter.resource = { $regex: req.query.resource, $options: 'i' };
    }

    // Filter theo IP address
    if (req.query.ipAddress) {
      filter.ipAddress = req.query.ipAddress;
    }

    // Filter theo status code
    if (req.query.statusCode) {
      filter.statusCode = parseInt(req.query.statusCode);
    }

    // Filter theo khoảng thời gian
    if (req.query.fromDate || req.query.toDate) {
      filter.timestamp = {};
      if (req.query.fromDate) {
        filter.timestamp.$gte = new Date(req.query.fromDate);
      }
      if (req.query.toDate) {
        filter.timestamp.$lte = new Date(req.query.toDate);
      }
    }

    // Search tổng quát
    if (req.query.q) {
      filter.$or = [
        { username: { $regex: req.query.q, $options: 'i' } },
        { resource: { $regex: req.query.q, $options: 'i' } },
        { endpoint: { $regex: req.query.q, $options: 'i' } },
        { ipAddress: { $regex: req.query.q, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'username email role')
        .sort(buildSort(sort || '-timestamp'))
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
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
    console.error('Error in getAll audit logs:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// GET /api/audit-logs/:id - Lấy chi tiết một log
exports.getById = async (req, res) => {
  try {
    const item = await AuditLog.findById(req.params.id).populate('userId', 'username email role');

    if (!item) {
      return res.status(404).json({ msg: 'Không tìm thấy audit log' });
    }

    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy audit log' });
    }
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// GET /api/audit-logs/stats - Thống kê audit logs (Admin only)
exports.getStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const dateFilter = {};

    if (fromDate || toDate) {
      dateFilter.timestamp = {};
      if (fromDate) dateFilter.timestamp.$gte = new Date(fromDate);
      if (toDate) dateFilter.timestamp.$lte = new Date(toDate);
    } else {
      // Mặc định lấy 30 ngày gần nhất
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.timestamp = { $gte: thirtyDaysAgo };
    }

    const [
      totalLogs,
      actionStats,
      resourceStats,
      statusCodeStats,
      topUsers,
      topIPs,
      errorLogs,
      avgResponseTime,
    ] = await Promise.all([
      // Tổng số logs
      AuditLog.countDocuments(dateFilter),

      // Thống kê theo action
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Thống kê theo resource
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$resource', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Thống kê theo status code
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$statusCode', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Top users có nhiều hoạt động nhất
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: { userId: '$userId', username: '$username' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Top IP addresses
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Số lượng errors (status >= 400)
      AuditLog.countDocuments({ ...dateFilter, statusCode: { $gte: 400 } }),

      // Thời gian phản hồi trung bình
      AuditLog.aggregate([
        { $match: { ...dateFilter, responseTime: { $exists: true } } },
        { $group: { _id: null, avgResponseTime: { $avg: '$responseTime' } } },
      ]),
    ]);

    res.json({
      summary: {
        totalLogs,
        errorLogs,
        successRate: totalLogs > 0 ? ((totalLogs - errorLogs) / totalLogs * 100).toFixed(2) : 0,
        avgResponseTime: avgResponseTime[0]?.avgResponseTime?.toFixed(2) || 0,
      },
      actionStats: actionStats.map((item) => ({
        action: item._id,
        count: item.count,
      })),
      resourceStats: resourceStats.map((item) => ({
        resource: item._id,
        count: item.count,
      })),
      statusCodeStats: statusCodeStats.map((item) => ({
        statusCode: item._id,
        count: item.count,
      })),
      topUsers: topUsers.map((item) => ({
        userId: item._id.userId,
        username: item._id.username,
        count: item.count,
      })),
      topIPs: topIPs.map((item) => ({
        ipAddress: item._id,
        count: item.count,
      })),
    });
  } catch (err) {
    console.error('Error in getStats audit logs:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// GET /api/audit-logs/user/:userId - Lấy lịch sử của một user cụ thể
exports.getByUserId = async (req, res) => {
  try {
    const { limit, skip, page, sort } = parseListParams(req.query);
    const filter = { userId: req.params.userId };

    // Filter theo action
    if (req.query.action) {
      filter.action = req.query.action;
    }

    // Filter theo thời gian
    if (req.query.fromDate || req.query.toDate) {
      filter.timestamp = {};
      if (req.query.fromDate) {
        filter.timestamp.$gte = new Date(req.query.fromDate);
      }
      if (req.query.toDate) {
        filter.timestamp.$lte = new Date(req.query.toDate);
      }
    }

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'username email role')
        .sort(buildSort(sort || '-timestamp'))
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
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
    console.error('Error in getByUserId audit logs:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};

// DELETE /api/audit-logs/cleanup - Xóa logs cũ (Admin only)
exports.cleanup = async (req, res) => {
  try {
    const { daysOld } = req.body;

    if (!daysOld || daysOld < 30) {
      return res.status(400).json({ msg: 'Chỉ được xóa logs cũ hơn 30 ngày' });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    res.json({
      msg: `Đã xóa ${result.deletedCount} audit logs cũ hơn ${daysOld} ngày`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error('Error in cleanup audit logs:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
};
