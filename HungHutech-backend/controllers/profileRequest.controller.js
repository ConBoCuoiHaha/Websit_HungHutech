const ProfileRequest = require('../schemas/profileRequest.model');
const NhanVien = require('../schemas/nhanVien.model');
const { parseListParams, buildSearchQuery } = require('../utils/pagination');

const editablePersonalFields = [
  'ho_dem',
  'ten',
  'biet_danh',
  'ngay_sinh',
  'gioi_tinh',
  'tinh_trang_hon_nhan',
  'quoc_tich',
  'thong_tin_ca_nhan',
];

const personalEditableFields = new Set(editablePersonalFields);
const editableContactFields = new Set(['dia_chi', 'lien_he']);

async function applyRequestToEmployee(employee, request) {
  if (!employee) return;
  if (request.type === 'personal') {
    Object.entries(request.payload || {}).forEach(([key, value]) => {
      if (personalEditableFields.has(key)) {
        employee[key] = value;
      }
    });
  } else if (request.type === 'contact') {
    if (request.payload.dia_chi) {
      employee.dia_chi = request.payload.dia_chi;
    }
    if (request.payload.lien_he) {
      employee.lien_he = request.payload.lien_he;
    }
  } else if (request.type === 'dependents') {
    const dependents = Array.isArray(employee.nguoi_phu_thuoc)
      ? [...employee.nguoi_phu_thuoc]
      : [];
    const { action, dependent, index } = request.payload || {};
    if (action === 'add' && dependent) {
      dependents.push(dependent);
    } else if (
      action === 'update' &&
      typeof index === 'number' &&
      dependents[index]
    ) {
      dependents[index] = dependent;
    } else if (action === 'delete' && typeof index === 'number') {
      dependents.splice(index, 1);
    }
    employee.nguoi_phu_thuoc = dependents;
  }
  await employee.save();
}

exports.createRequest = async (req, res) => {
  try {
    if (!req.user?.nhan_vien_id) {
      return res.status(400).json({ msg: 'Tai khoan khong gan voi nhan vien' });
    }
    const { type, payload, note } = req.body || {};
    if (!type || !payload) {
      return res.status(400).json({ msg: 'Thieu du lieu yeu cau' });
    }
    const request = await ProfileRequest.create({
      nhan_vien_id: req.user.nhan_vien_id,
      type,
      payload,
      note,
    });
    res.status(201).json(request);
  } catch (err) {
    console.error('createRequest error', err);
    res.status(400).json({ msg: 'Khong the gui yeu cau', error: err.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    if (!req.user?.nhan_vien_id) {
      return res.status(400).json({ msg: 'Tai khoan khong gan voi nhan vien' });
    }
    const requests = await ProfileRequest.find({ nhan_vien_id: req.user.nhan_vien_id })
      .sort('-ngay_tao')
      .limit(20);
    res.json({ data: requests });
  } catch (err) {
    console.error('getMyRequests error', err);
    res.status(500).json({ msg: 'Khong the tai yeu cau', error: err.message });
  }
};

exports.listRequests = async (req, res) => {
  try {
    const { limit, skip, page } = parseListParams(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.nhan_vien_id) filter.nhan_vien_id = req.query.nhan_vien_id;
    const keyword = (req.query.q || '').toString().trim();
    const search = keyword ? buildSearchQuery(keyword, ['note']) : {};
    Object.assign(filter, search);
    const [items, total] = await Promise.all([
      ProfileRequest.find(filter)
        .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
        .populate('reviewed_by', 'ma_nhan_vien ho_dem ten')
        .sort('-ngay_tao')
        .skip(skip)
        .limit(limit),
      ProfileRequest.countDocuments(filter),
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
    console.error('listRequests error', err);
    res.status(500).json({ msg: 'Khong the tai yeu cau', error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, approver_note } = req.body || {};
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Trang thai khong hop le' });
    }
    const request = await ProfileRequest.findById(req.params.id).populate('nhan_vien_id');
    if (!request) {
      return res.status(404).json({ msg: 'Khong tim thay yeu cau' });
    }
    if (request.status !== 'Pending') {
      return res.status(400).json({ msg: 'Yeu cau da duoc xu ly' });
    }
    request.status = status;
    request.approver_note = approver_note;
    request.reviewed_by = req.user?.nhan_vien_id || null;
    request.reviewed_at = new Date();
    if (status === 'Approved') {
      const employee = await NhanVien.findById(request.nhan_vien_id._id);
      await applyRequestToEmployee(employee, request);
    }
    await request.save();
    res.json(request);
  } catch (err) {
    console.error('updateStatus error', err);
    res.status(400).json({ msg: 'Khong the cap nhat trang thai', error: err.message });
  }
};
