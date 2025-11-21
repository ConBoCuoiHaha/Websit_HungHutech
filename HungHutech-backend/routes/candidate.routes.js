const express = require('express');
const router = express.Router();
const {body, param, query} = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {handleValidation} = require('../utils/validator');
const {allowRoles} = require('../utils/authHandler');
const {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  importCandidateFromResume,
  updatePipelineStage,
  searchCandidatePool,
} = require('../controllers/candidate.controller');

const resumesDir = path.join(__dirname, '../uploads/resumes');
const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(resumesDir, {recursive: true});
    cb(null, resumesDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  },
});
const resumeUpload = multer({
  storage: resumeStorage,
  limits: {fileSize: 5 * 1024 * 1024},
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Dinh dang file khong ho tro'));
    }
    cb(null, true);
  },
});

router
  .route('/')
  .post(
    [allowRoles('admin', 'manager'), body('ho_ten').isString().notEmpty(), body('email').isEmail()],
    handleValidation,
    createCandidate,
  )
  .get(
    [
      query('q').optional().isString(),
      query('trang_thai').optional().isString(),
      query('nguon').optional().isString(),
      query('tag').optional().isString(),
      query('pipeline_stage').optional().isString(),
    ],
    handleValidation,
    getAllCandidates,
  );

router.get(
  '/pool/search',
  [allowRoles('admin', 'manager'), query('ky_nang').optional().isString()],
  handleValidation,
  searchCandidatePool,
);

router.post(
  '/import-resume',
  allowRoles('admin', 'manager'),
  resumeUpload.single('cv'),
  importCandidateFromResume,
);

router
  .route('/:id')
  .get([param('id').isMongoId()], handleValidation, getCandidateById)
  .put([allowRoles('admin', 'manager'), param('id').isMongoId()], handleValidation, updateCandidate)
  .delete([allowRoles('admin', 'manager'), param('id').isMongoId()], handleValidation, deleteCandidate);

router.post(
  '/:id/pipeline',
  [
    allowRoles('admin', 'manager'),
    param('id').isMongoId(),
    body('stage').isString().notEmpty(),
    body('score').optional().isNumeric(),
    body('note').optional().isString(),
  ],
  handleValidation,
  updatePipelineStage,
);

module.exports = router;
