const AuditLog = require('../schemas/auditLog.model');

/**
 * Middleware để tự động log mọi API request
 * Ghi lại: user, action, endpoint, IP, response time, status code
 */
function auditLogger(req, res, next) {
  // Bỏ qua các routes không cần log
  const skipRoutes = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/upload',
    '/health',
    '/favicon.ico',
  ];

  const shouldSkip = skipRoutes.some((route) => req.path.startsWith(route));
  if (shouldSkip) {
    return next();
  }

  // Chỉ log nếu user đã authenticated
  if (!req.user) {
    return next();
  }

  const startTime = Date.now();

  // Override res.json để capture response
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    res.locals.responseBody = body;
    return originalJson(body);
  };

  // Override res.send để capture response
  const originalSend = res.send.bind(res);
  res.send = function (body) {
    res.locals.responseBody = body;
    return originalSend(body);
  };

  // Hook vào response finish để log
  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - startTime;

      // Phân tích action từ method và path
      const action = determineAction(req.method, req.path);
      const resource = extractResource(req.path);

      // Lấy IP address
      const ipAddress =
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        'unknown';

      // Tạo audit log
      const auditData = {
        userId: req.user.id || req.user._id || null,
        username: req.user.username || req.user.email || 'unknown',
        action,
        resource,
        resourceId: extractResourceId(req.path),
        method: req.method,
        endpoint: req.originalUrl || req.url,
        ipAddress,
        userAgent: req.headers['user-agent'] || 'unknown',
        statusCode: res.statusCode,
        responseTime,
        details: {
          query: req.query,
          params: req.params,
          // Không log sensitive data như password
          body: sanitizeBody(req.body),
        },
        timestamp: new Date(),
      };

      // Nếu có lỗi, log error message
      if (res.statusCode >= 400 && res.locals.responseBody) {
        try {
          const errorBody =
            typeof res.locals.responseBody === 'string'
              ? JSON.parse(res.locals.responseBody)
              : res.locals.responseBody;
          auditData.errorMessage = errorBody.msg || errorBody.message || 'Unknown error';
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      // Lưu vào database (async, không block response)
      await AuditLog.create(auditData);
    } catch (err) {
      // Không throw error để không ảnh hưởng API response
      console.error('Error creating audit log:', err.message);
    }
  });

  next();
}

/**
 * Xác định action dựa trên HTTP method và path
 */
function determineAction(method, path) {
  if (path.includes('/login')) return 'LOGIN';
  if (path.includes('/logout')) return 'LOGOUT';
  if (path.includes('/export')) return 'EXPORT';
  if (path.includes('/import')) return 'IMPORT';
  if (path.includes('/approve')) return 'APPROVE';
  if (path.includes('/reject')) return 'REJECT';
  if (path.includes('/upload')) return 'UPLOAD';
  if (path.includes('/download')) return 'DOWNLOAD';

  switch (method) {
    case 'GET':
      return 'READ';
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'OTHER';
  }
}

/**
 * Trích xuất resource name từ path
 * VD: /api/nhanvien/123 -> nhanvien
 */
function extractResource(path) {
  const match = path.match(/\/api\/([^\/]+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Trích xuất resource ID từ path
 * VD: /api/nhanvien/123 -> 123
 */
function extractResourceId(path) {
  // Pattern: /api/resource/:id hoặc /api/module/resource/:id
  const patterns = [
    /\/api\/[^\/]+\/([a-f0-9]{24})/i, // MongoDB ObjectId
    /\/api\/[^\/]+\/(\d+)/, // Numeric ID
    /\/api\/[^\/]+\/[^\/]+\/([a-f0-9]{24})/i, // Nested route
  ];

  for (const pattern of patterns) {
    const match = path.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Loại bỏ sensitive data từ request body
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'passwordHash', 'otpSecret', 'token', 'refreshToken'];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });

  return sanitized;
}

module.exports = auditLogger;
