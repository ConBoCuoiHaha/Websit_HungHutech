const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../schemas/user.model');
const { body } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const config = require('../config');

// Validators
const registerValidators = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  body('role').optional().isIn(['admin', 'manager', 'employee']).withMessage('Vai trò không hợp lệ'),
  handleValidation,
];

const loginValidators = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isString().notEmpty().withMessage('Thiếu mật khẩu'),
  handleValidation,
];

// Helpers
function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role, nhan_vien_id: user.nhan_vien_id || null }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

// If no users exist, allow public register to create first admin
async function canOpenRegister() {
  const count = await User.countDocuments({});
  return count === 0;
}

// Controllers
async function register(req, res) {
  try {
    const open = await canOpenRegister();
    if (!open && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ msg: 'Chỉ admin được tạo tài khoản mới' });
    }
    const { email, password, role = 'employee', nhan_vien_id = null } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ msg: 'Email đã tồn tại' });
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash, role: open ? 'admin' : role, nhan_vien_id });
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, active: true });
    if (!user) return res.status(401).json({ msg: 'Sai thông tin đăng nhập' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ msg: 'Sai thông tin đăng nhập' });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, email: user.email, role: user.role, nhan_vien_id: user.nhan_vien_id || null } });
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select('_id email role nhan_vien_id');
    if (!user) return res.status(404).json({ msg: 'Không tìm thấy người dùng' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi máy chủ', error: err.message });
  }
}

async function logout(req, res) {
  // Since we're using JWT (stateless), logout is handled client-side
  // Just return success
  res.json({ msg: 'Đăng xuất thành công' });
}

module.exports = { register, registerValidators, login, loginValidators, me, logout };
