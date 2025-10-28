const express = require('express');
const router = express.Router();
const { register, registerValidators, login, loginValidators, me, logout } = require('../controllers/auth.controller');
const { auth } = require('../utils/authHandler');

router.post('/register', registerValidators, register);
router.post('/login', loginValidators, login);
router.get('/me', auth, me);
router.post('/logout', auth, logout);

module.exports = router;

