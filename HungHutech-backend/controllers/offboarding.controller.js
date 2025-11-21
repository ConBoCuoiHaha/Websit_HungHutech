const Offboarding = require('../schemas/offboarding.model');
const NhanVien = require('../schemas/nhanVien.model');
const { ensureOffboardingForEmployee } = require('../services/offboardingService');

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Offboarding.find(filter)
        .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten thong_tin_cong_viec.phong_ban_id')
        .populate('requested_by', 'email')
        .sort('-ngay_tao')
        .skip(skip)
        .limit(Number(limit)),
      Offboarding.countDocuments(filter),
    ]);

    res.json({
      data: items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    });
  } catch (err) {
    console.error('offboarding.list error', err);
    res.status(500).json({ msg: 'Khong the tai danh sach offboarding', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const record = await Offboarding.findById(req.params.id)
      .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten thong_tin_cong_viec')
      .populate('tasks.assigned_to', 'ma_nhan_vien ho_dem ten');
    if (!record) {
      return res.status(404).json({ msg: 'Khong tim thay yeu cau offboarding' });
    }
    res.json(record);
  } catch (err) {
    console.error('offboarding.getById error', err);
    res.status(500).json({ msg: 'Khong the tai chi tiet', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nhan_vien_id, last_working_day, reason } = req.body || {};
    if (!nhan_vien_id) {
      return res.status(400).json({ msg: 'Thieu nhan_vien_id' });
    }
    const employee = await NhanVien.findById(nhan_vien_id).select('_id ho_dem ten ma_nhan_vien lien_he');
    if (!employee) {
      return res.status(404).json({ msg: 'Khong tim thay nhan vien' });
    }
    const exists = await Offboarding.findOne({ nhan_vien_id, status: { $in: ['Pending', 'InProgress'] } });
    if (exists) {
      return res.status(400).json({ msg: 'Nhan vien da co yeu cau offboarding dang xu ly' });
    }

    const record = await ensureOffboardingForEmployee(employee, {
      lastWorkingDay: last_working_day || null,
      reason: reason || 'Yeu cau offboarding thu cong',
      requested_by: req.user?.id || null,
    });
    res.status(201).json(record);
  } catch (err) {
    console.error('offboarding.create error', err);
    res.status(500).json({ msg: 'Khong the tao yeu cau offboarding', error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body || {};
    if (!['Pending', 'InProgress', 'Completed'].includes(status)) {
      return res.status(400).json({ msg: 'Trang thai khong hop le' });
    }
    const record = await Offboarding.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ msg: 'Khong tim thay yeu cau' });
    }
    record.status = status;
    if (note !== undefined) record.note = note;
    if (status === 'Completed') {
      record.tasks = record.tasks.map((task) => {
        if (task.status !== 'Completed') {
          task.status = 'Completed';
          task.completed_at = new Date();
        }
        return task;
      });
    }
    await record.save();
    res.json(record);
  } catch (err) {
    console.error('offboarding.updateStatus error', err);
    res.status(500).json({ msg: 'Khong the cap nhat trang thai', error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { status, note, due_date } = req.body || {};
    const record = await Offboarding.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ msg: 'Khong tim thay yeu cau' });
    }
    const task = record.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Khong tim thay tac vu' });
    }
    if (status && ['Pending', 'InProgress', 'Completed'].includes(status)) {
      task.status = status;
      if (status === 'Completed') {
        task.completed_at = new Date();
      }
    }
    if (note !== undefined) task.note = note;
    if (due_date) task.due_date = new Date(due_date);

    await record.save();
    res.json(record);
  } catch (err) {
    console.error('offboarding.updateTask error', err);
    res.status(500).json({ msg: 'Khong the cap nhat tac vu', error: err.message });
  }
};

exports.upcoming = async (req, res) => {
  try {
    const { days = 30, limit = 5 } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const future = new Date(today);
    future.setDate(future.getDate() + Number(days || 30));
    const filter = {
      status: { $in: ['Pending', 'InProgress'] },
      last_working_day: { $gte: today, $lte: future },
    };
    const items = await Offboarding.find(filter)
      .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten thong_tin_cong_viec.phong_ban_id')
      .sort('last_working_day')
      .limit(Number(limit) || 5)
      .lean();
    res.json({ data: items });
  } catch (err) {
    console.error('offboarding.upcoming error', err);
    res.status(500).json({ msg: 'Khong the tai danh sach sap nghi viec', error: err.message });
  }
};

