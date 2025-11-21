const Candidate = require('../schemas/candidate.model');
const {parseListParams, buildSort, buildSearchQuery} = require('../utils/pagination');
const {parseResume} = require('../services/resumeParser');

exports.createCandidate = async (req, res) => {
  try {
    const doc = await Candidate.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({msg: 'Khong the tao ung vien', error: err.message});
  }
};

exports.getAllCandidates = async (req, res) => {
  try {
    const {limit, skip, q, sort, page} = parseListParams(req.query);
    const filter = {da_xoa: false, ...buildSearchQuery(q, ['ho_ten', 'email', 'dien_thoai'])};
    if (req.query.trang_thai) filter.trang_thai = req.query.trang_thai;
    if (req.query.pipeline_stage) filter.pipeline_stage = req.query.pipeline_stage;
    if (req.query.nguon) filter.nguon = req.query.nguon;
    if (req.query.tag) {
      const tagsRaw = Array.isArray(req.query.tag)
        ? req.query.tag
        : String(req.query.tag)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
      if (tagsRaw.length) filter.tags = {$all: tagsRaw};
    }
    if (req.query.ky_nang) {
      const skills = String(req.query.ky_nang)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (skills.length) filter.ky_nang = {$all: skills};
    }
    const [items, total] = await Promise.all([
      Candidate.find(filter).sort(buildSort(sort)).skip(skip).limit(limit),
      Candidate.countDocuments(filter),
    ]);
    res.json({data: items, pagination: {total, page, limit, totalPages: Math.ceil(total / limit)}});
  } catch (err) {
    res.status(500).json({msg: 'Loi may chu', error: err.message});
  }
};

exports.getCandidateById = async (req, res) => {
  try {
    const item = await Candidate.findById(req.params.id);
    if (!item || item.da_xoa) return res.status(404).json({msg: 'Khong tim thay ung vien'});
    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({msg: 'Khong tim thay ung vien'});
    res.status(500).json({msg: 'Loi may chu'});
  }
};

exports.updateCandidate = async (req, res) => {
  try {
    const item = await Candidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({msg: 'Khong tim thay ung vien'});
    res.json(item);
  } catch (err) {
    res.status(400).json({msg: 'Khong the cap nhat', error: err.message});
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    const item = await Candidate.findByIdAndUpdate(
      req.params.id,
      {da_xoa: true},
      {new: true},
    );
    if (!item) return res.status(404).json({msg: 'Khong tim thay ung vien'});
    res.json({msg: 'Ung vien da duoc xoa thanh cong'});
  } catch (err) {
    res.status(500).json({msg: 'Loi may chu'});
  }
};

exports.importCandidateFromResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({msg: 'Chua co file CV'});
  }
  try {
    const {parsed, score} = await parseResume(req.file.path, req.file.mimetype);
    const email = parsed.email || req.body.email;
    if (!email) {
      return res
        .status(400)
        .json({msg: 'Khong tim thay email trong CV, vui long nhap thu cong'});
    }
    const rawTags = req.body.tags;
    let tags = [];
    if (Array.isArray(rawTags)) tags = rawTags;
    else if (typeof rawTags === 'string' && rawTags.trim()) {
      tags = rawTags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    const doc = await Candidate.create({
      ho_ten: parsed.ho_ten || req.body.ho_ten || 'Ung vien chua ro',
      email,
      dien_thoai: parsed.dien_thoai || req.body.dien_thoai || '',
      ky_nang: parsed.ky_nang || [],
      tags,
      nguon: req.body.nguon || 'CV_upload',
      vi_tri_mong_muon: req.body.vi_tri_mong_muon || '',
      score,
      pipeline_stage: req.body.pipeline_stage || 'CV_moi',
      parsed_fields: parsed,
      cv_file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/resumes/${req.file.filename}`,
      },
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error('importCandidateFromResume error', err);
    res.status(500).json({msg: 'Khong the phan tich CV', error: err.message});
  }
};

exports.updatePipelineStage = async (req, res) => {
  try {
    const {stage, note, score} = req.body;
    const item = await Candidate.findById(req.params.id);
    if (!item) {
      return res.status(404).json({msg: 'Khong tim thay ung vien'});
    }
    if (stage) item.pipeline_stage = stage;
    if (typeof score === 'number') item.score = score;
    item.pipeline_history.push({
      stage: stage || item.pipeline_stage,
      ghi_chu: note || '',
      nguoi_cap_nhat_id: req.user?.nhan_vien_id || null,
      score: typeof score === 'number' ? score : undefined,
    });
    await item.save();
    res.json(item);
  } catch (err) {
    console.error('updatePipelineStage error', err);
    res.status(500).json({msg: 'Khong the cap nhat pipeline', error: err.message});
  }
};

exports.searchCandidatePool = async (req, res) => {
  try {
    const {limit, skip, page} = parseListParams(req.query);
    const filter = {da_xoa: false};
    if (req.query.ky_nang) {
      const skills = String(req.query.ky_nang)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (skills.length) filter.ky_nang = {$all: skills};
    }
    if (req.query.vi_tri_mong_muon) {
      filter.vi_tri_mong_muon = new RegExp(req.query.vi_tri_mong_muon, 'i');
    }
    if (req.query.pipeline_stage) {
      filter.pipeline_stage = req.query.pipeline_stage;
    }
    if (req.query.min_score) {
      filter.score = {$gte: Number(req.query.min_score)};
    }
    if (req.query.min_exp) {
      filter.kinh_nghiem_nam = {$gte: Number(req.query.min_exp)};
    }
    const [items, total] = await Promise.all([
      Candidate.find(filter).sort('-score').skip(skip).limit(limit),
      Candidate.countDocuments(filter),
    ]);
    res.json({
      data: items,
      pagination: {total, page, limit, totalPages: Math.ceil(total / limit)},
    });
  } catch (err) {
    console.error('searchCandidatePool error', err);
    res.status(500).json({msg: 'Khong the tim kiem ung vien', error: err.message});
  }
};
