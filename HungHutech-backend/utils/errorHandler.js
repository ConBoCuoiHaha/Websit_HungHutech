function notFound(req, res, next) {
  const error = new Error(`Không tìm thấy tài nguyên - ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, req, res, next) {
  // Nếu header đã gửi, chuyển cho xử lý lỗi mặc định
  if (res.headersSent) return next(err);

  const status = err.status || err.statusCode || 500;

  // Log lỗi cho development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  // Xử lý các loại lỗi MongoDB
  let message = err.message || 'Lỗi máy chủ';

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    message = `Giá trị ${field} đã tồn tại trong hệ thống`;
    return res.status(409).json({
      msg: message,
      field: field,
      type: 'duplicate_key'
    });
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      msg: 'Dữ liệu không hợp lệ',
      errors: errors,
      type: 'validation_error'
    });
  }

  // MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    message = `Định dạng ID không hợp lệ cho trường ${err.path}`;
    return res.status(400).json({
      msg: message,
      field: err.path,
      type: 'cast_error'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      msg: 'Token không hợp lệ',
      type: 'jwt_error'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      msg: 'Token đã hết hạn',
      type: 'jwt_expired'
    });
  }

  // Response lỗi chung
  const response = {
    msg: message,
    status: status
  };

  // Thêm stack trace trong development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

module.exports = { notFound, errorHandler };

