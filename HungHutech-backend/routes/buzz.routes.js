const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../utils/validator');
const { auth } = require('../utils/authHandler');
const { createPost, getAllPosts, likePost, commentPost, getComments } = require('../controllers/buzz.controller');

router.route('/')
  .post([auth, body('noi_dung').isString().notEmpty()], handleValidation, createPost)
  .get([query('q').optional().isString()], handleValidation, getAllPosts);

router.post('/:id/like', [auth, param('id').isMongoId()], handleValidation, likePost);
router.post('/:id/comment', [auth, param('id').isMongoId(), body('noi_dung').isString().notEmpty()], handleValidation, commentPost);
router.get('/:id/comments', [auth, param('id').isMongoId()], handleValidation, getComments);

module.exports = router;

