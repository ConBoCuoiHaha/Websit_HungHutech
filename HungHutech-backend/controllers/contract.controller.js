const Contract = require('../schemas/contract.model');
const NhanVien = require('../schemas/nhanVien.model');
const { parseListParams, buildSearchQuery } = require('../utils/pagination');

function pushAudit(doc, action, user, note) {
  if (!doc.audit_log) doc.audit_log = [];
  doc.audit_log.push({
    action,
    user_id: user?.nhan_vien_id || null,
    ghi_chu: note,
    at: new Date(),
  });
}

async function applySalaryToEmployee(contract) {
  if (!contract.luong_co_ban || !contract.nhan_vien_id) return;
  const employee = await NhanVien.findById(contract.nhan_vien_id).select('luong');
  if (!employee) return;
  const salaryEntry = {
    ten_luong: `Hợp đồng ${contract.so_hop_dong}`,
    so_tien: contract.luong_co_ban,
    ky_tra_luong: 'Hàng tháng',
    ghi_chu: `Áp dụng từ ${contract.hieu_luc_tu ? new Date(contract.hieu_luc_tu).toLocaleDateString('vi-VN') : ''}`,
  };
  employee.luong = employee.luong || [];
  employee.luong.unshift(salaryEntry);
  await employee.save();
}

exports.listContracts = async (req, res) => {
  try {
    const { limit, skip, page } = parseListParams(req.query);
    const filter = {};
    if (req.query.nhan_vien_id) filter.nhan_vien_id = req.query.nhan_vien_id;
    if (req.query.trang_thai) filter.trang_thai = req.query.trang_thai;
    const keyword = (req.query.q || '').toString().trim();
    const search = keyword ? buildSearchQuery(keyword, ['so_hop_dong', 'ghi_chu']) : {};
    Object.assign(filter, search);

    const [items, total] = await Promise.all([
      Contract.find(filter)
        .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten')
        .populate('created_by', 'ho_dem ten')
        .populate('updated_by', 'ho_dem ten')
        .sort('-hieu_luc_tu')
        .skip(skip)
        .limit(limit),
      Contract.countDocuments(filter),
    ]);

    res.json({
      data: items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('listContracts error', err);
    res.status(500).json({ msg: 'Không thể tải danh sách hợp đồng', error: err.message });
  }
};

exports.getContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten');
    if (!contract) return res.status(404).json({ msg: 'Không tìm thấy hợp đồng' });
    res.json(contract);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy hợp đồng' });
    }
    res.status(500).json({ msg: 'Không thể tải hợp đồng', error: err.message });
  }
};

exports.createContract = async (req, res) => {
  try {
    const payload = req.body;
    const employee = await NhanVien.findById(payload.nhan_vien_id).select('_id ma_nhan_vien');
    if (!employee) {
      return res.status(404).json({ msg: 'Không tìm thấy nhân viên' });
    }
    const contract = new Contract({
      ...payload,
      created_by: req.user?.nhan_vien_id || null,
      updated_by: req.user?.nhan_vien_id || null,
    });
    pushAudit(contract, 'create', req.user, 'Tạo hợp đồng');
    await contract.save();
    res.status(201).json(contract);
  } catch (err) {
    console.error('createContract error', err);
    res.status(400).json({ msg: 'Không thể tạo hợp đồng', error: err.message });
  }
};

exports.updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body, updated_by: req.user?.nhan_vien_id || null };
    const contract = await Contract.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!contract) return res.status(404).json({ msg: 'Không tìm thấy hợp đồng' });
    pushAudit(contract, 'update', req.user, 'Cập nhật thông tin hợp đồng');
    await contract.save();
    res.json(contract);
  } catch (err) {
    console.error('updateContract error', err);
    res.status(400).json({ msg: 'Không thể cập nhật hợp đồng', error: err.message });
  }
};

exports.changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trang_thai, ghi_chu } = req.body;
    const allowed = ['Draft', 'Cho_duyet', 'Da_ky', 'Da_huy'];
    if (!allowed.includes(trang_thai)) {
      return res.status(400).json({ msg: 'Trạng thái không hợp lệ' });
    }
    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ msg: 'Không tìm thấy hợp đồng' });
    contract.trang_thai = trang_thai;
    if (trang_thai === 'Da_ky') {
      contract.ngay_ky = contract.ngay_ky || new Date();
      await applySalaryToEmployee(contract);
    }
    pushAudit(contract, 'status_change', req.user, ghi_chu || `Trạng thái -> ${trang_thai}`);
    await contract.save();
    res.json(contract);
  } catch (err) {
    console.error('changeStatus error', err);
    res.status(400).json({ msg: 'Không thể cập nhật trạng thái', error: err.message });
  }
};

exports.deleteContract = async (req, res) => {
  try {
    const contract = await Contract.findByIdAndDelete(req.params.id);
    if (!contract) return res.status(404).json({ msg: 'Không tìm thấy hợp đồng' });
    res.json({ msg: 'Đã xóa hợp đồng' });
  } catch (err) {
    console.error('deleteContract error', err);
    res.status(400).json({ msg: 'Không thể xóa hợp đồng', error: err.message });
  }
};


exports.listExpiringContracts = async (req, res) => {
  try {
    const days = Number(req.query.days || 60);
    const limit = Number(req.query.limit || 5);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + days);

    const items = await Contract.find({
      trang_thai: 'Da_ky',
      hieu_luc_den: { $ne: null, $gte: today, $lte: end },
    })
      .populate('nhan_vien_id', 'ma_nhan_vien ho_dem ten thong_tin_cong_viec.phong_ban_id')
      .sort('hieu_luc_den')
      .limit(limit)
      .lean();

    res.json({ data: items });
  } catch (err) {
    console.error('listExpiringContracts error', err);
    res.status(500).json({ msg: 'Khong the tai danh sach hop dong sap het han', error: err.message });
  }
};
