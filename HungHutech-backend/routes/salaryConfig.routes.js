const express = require('express');
const router = express.Router();
const salaryConfigController = require('../controllers/salaryConfig.controller');
const { auth } = require('../utils/authHandler');

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ msg: 'Chi admin moi duoc thay doi cau hinh thu nhap' });
  }
  next();
};

router.use(auth);
router.get('/', salaryConfigController.get);
router.put('/', requireAdmin, salaryConfigController.update);

module.exports = router;
