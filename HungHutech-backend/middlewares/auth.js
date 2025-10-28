const jwt = require('jsonwebtoken');
const config = require('../config');

function auth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) return res.status(401).json({ msg: 'Thiếu token xác thực' });
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token không hợp lệ' });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ msg: 'Chưa xác thực' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ msg: 'Không có quyền truy cập' });
    next();
  };
}

module.exports = { auth, allowRoles };

