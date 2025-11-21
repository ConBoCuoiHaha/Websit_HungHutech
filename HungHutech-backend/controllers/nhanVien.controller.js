const NhanVien = require('../schemas/nhanVien.model.js');
const TrangThaiLaoDong = require('../schemas/trangThaiLaoDong.model');
const {ensureOffboardingForEmployee} = require('../services/offboardingService');

const normalizeText = (value = '') =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const TERMINATION_REGEX = /(nghi|thoi|ket thuc|resign|terminate)/;
const isTerminationStatus = (name = '') => TERMINATION_REGEX.test(normalizeText(name));

exports.createNhanVien = async (req, res) => {
  try {
    const duLieuNhanVienMoi = req.body;
    console.log('📝 Received data:', JSON.stringify(duLieuNhanVienMoi, null, 2));

    // Tự động tạo mã nhân viên nếu không có hoặc bị trùng
    if (!duLieuNhanVienMoi.ma_nhan_vien || duLieuNhanVienMoi.ma_nhan_vien.trim() === '') {
      // Tìm mã nhân viên lớn nhất
      const lastEmployee = await NhanVien.findOne()
        .sort({ ma_nhan_vien: -1 })
        .select('ma_nhan_vien')
        .lean();

      if (lastEmployee && lastEmployee.ma_nhan_vien) {
        // Trích xuất số từ mã nhân viên (ví dụ: NV011 -> 11)
        const match = lastEmployee.ma_nhan_vien.match(/(\d+)$/);
        if (match) {
          const nextNumber = parseInt(match[1]) + 1;
          duLieuNhanVienMoi.ma_nhan_vien = `NV${String(nextNumber).padStart(3, '0')}`;
        } else {
          duLieuNhanVienMoi.ma_nhan_vien = 'NV001';
        }
      } else {
        duLieuNhanVienMoi.ma_nhan_vien = 'NV001';
      }
      console.log('✅ Auto-generated ma_nhan_vien:', duLieuNhanVienMoi.ma_nhan_vien);
    }

    const nhanVien = new NhanVien(duLieuNhanVienMoi);
    await nhanVien.save();
    res.status(201).json(nhanVien);
  } catch (err) {
    console.error('❌ Error creating employee:', err.message);
    console.error('❌ Full error:', err);

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      return res.status(400).json({
        msg: 'Dữ liệu không hợp lệ',
        errors: errors,
        details: err.message
      });
    }

    // Handle duplicate key error (unique constraint) - Retry with new code
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];

      // Nếu trùng mã nhân viên, tự động tạo mã mới
      if (field === 'ma_nhan_vien') {
        try {
          // Tạo mã ngẫu nhiên với timestamp
          const timestamp = Date.now();
          const randomCode = `NV${timestamp.toString().slice(-6)}`;
          duLieuNhanVienMoi.ma_nhan_vien = randomCode;

          console.log('🔄 Retry with new ma_nhan_vien:', randomCode);

          const nhanVien = new NhanVien(duLieuNhanVienMoi);
          await nhanVien.save();
          return res.status(201).json(nhanVien);
        } catch (retryErr) {
          console.error('❌ Retry failed:', retryErr.message);
          return res.status(400).json({
            msg: 'Không thể tạo mã nhân viên duy nhất',
            error: 'Vui lòng thử lại sau',
          });
        }
      }

      return res.status(400).json({
        msg: 'Dữ liệu bị trùng lặp',
        error: `${field} đã tồn tại trong hệ thống`,
        field: field
      });
    }

    res.status(400).json({ msg: 'Không thể tạo nhân viên', error: err.message });
  }
};

const {parseListParams, buildSort, buildSearchQuery} = require('../utils/pagination');

exports.getAllNhanVien = async (req, res) => {
  try {
    const {limit, skip, q, sort, page} = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, [
      'ma_nhan_vien',
      'ho_dem',
      'ten',
      'lien_he.email_cong_viec',
    ])};

    const [items, total] = await Promise.all([
      NhanVien.find(filter)
        .populate('thong_tin_cong_viec.chuc_danh_id', 'ten_chuc_danh')
        .populate('thong_tin_cong_viec.trang_thai_lao_dong_id', 'ten')
        .populate('thong_tin_cong_viec.phong_ban_id', 'ten')
        .populate('thong_tin_cong_viec.ca_lam_viec_id', 'ten_ca gio_bat_dau gio_ket_thuc')
        .populate('thong_tin_cong_viec.dia_diem_lam_viec_ids', 'ten')
        .sort(buildSort(sort))
        .skip(skip)
        .limit(limit),
      NhanVien.countDocuments(filter),
    ]);

    res.json({
      data: items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

exports.getNhanVienById = async (req, res) => {
  try {
    const nhanVien = await NhanVien.findById(req.params.id)
      .populate('thong_tin_cong_viec.chuc_danh_id', 'ten_chuc_danh')
      .populate('thong_tin_cong_viec.trang_thai_lao_dong_id', 'ten')
      .populate('thong_tin_cong_viec.phong_ban_id', 'ten')
      .populate('thong_tin_cong_viec.ca_lam_viec_id', 'ten_ca gio_bat_dau gio_ket_thuc')
      .populate('thong_tin_cong_viec.dia_diem_lam_viec_ids', 'ten')
      .populate('thong_tin_cong_viec.quan_ly_truc_tiep_ids', 'ho_dem ten');

    if (!nhanVien || nhanVien.da_xoa) {
      return res.status(404).json({ msg: 'Không tìm thấy nhân viên' });
    }
    res.json(nhanVien);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy nhân viên' });
    }
    res.status(500).send('Lỗi máy chủ');
  }
};

exports.updateNhanVien = async (req, res) => {
  try {
    console.log('📝 Update Employee - ID:', req.params.id);
    console.log('📝 Update Data received:', JSON.stringify(req.body, null, 2));

    const updateData = {...req.body};

    // Map cac truong phang ve thong_tin_ca_nhan de ho tro UI hien tai
    if (
      updateData.so_cmnd !== undefined ||
      updateData.ngay_cap_cmnd !== undefined ||
      updateData.noi_cap_cmnd !== undefined ||
      updateData.so_ho_chieu !== undefined
    ) {
      if (!updateData.thong_tin_ca_nhan) updateData.thong_tin_ca_nhan = {};
      if (updateData.so_cmnd !== undefined) {
        updateData.thong_tin_ca_nhan.cmnd_cccd = updateData.so_cmnd;
        delete updateData.so_cmnd;
      }
      if (updateData.ngay_cap_cmnd !== undefined) {
        updateData.thong_tin_ca_nhan.ngay_cap_cmnd = updateData.ngay_cap_cmnd;
        delete updateData.ngay_cap_cmnd;
      }
      if (updateData.noi_cap_cmnd !== undefined) {
        updateData.thong_tin_ca_nhan.noi_cap_cmnd = updateData.noi_cap_cmnd;
        delete updateData.noi_cap_cmnd;
      }
      if (updateData.so_ho_chieu !== undefined) {
        updateData.thong_tin_ca_nhan.so_ho_chieu = updateData.so_ho_chieu;
        delete updateData.so_ho_chieu;
      }
    }

    // Handle nested thong_tin_cong_viec updates - extract populated ObjectIds
    if (updateData.thong_tin_cong_viec) {
      const ttcv = updateData.thong_tin_cong_viec;
      if (ttcv.chuc_danh_id && typeof ttcv.chuc_danh_id === 'object') ttcv.chuc_danh_id = ttcv.chuc_danh_id._id;
      if (ttcv.phong_ban_id && typeof ttcv.phong_ban_id === 'object') ttcv.phong_ban_id = ttcv.phong_ban_id._id;
      if (ttcv.trang_thai_lao_dong_id && typeof ttcv.trang_thai_lao_dong_id === 'object') ttcv.trang_thai_lao_dong_id = ttcv.trang_thai_lao_dong_id._id;
      if (ttcv.ca_lam_viec_id && typeof ttcv.ca_lam_viec_id === 'object') ttcv.ca_lam_viec_id = ttcv.ca_lam_viec_id._id;
      if (ttcv.quan_ly_truc_tiep_ids && Array.isArray(ttcv.quan_ly_truc_tiep_ids)) {
        ttcv.quan_ly_truc_tiep_ids = ttcv.quan_ly_truc_tiep_ids.map(id => typeof id === 'object' && id._id ? id._id : id);
      }
    }

    console.log('📝 Processed updateData:', JSON.stringify(updateData, null, 2));

    // Handle empty strings in unique index fields to avoid duplicate key errors
    // MongoDB unique indexes treat empty strings as duplicates
    if (updateData.lien_he) {
      // Remove empty string fields that have unique indexes
      if (updateData.lien_he.email_khac === '') {
        delete updateData.lien_he.email_khac;
      }
      if (updateData.lien_he.email_cong_viec === '') {
        delete updateData.lien_he.email_cong_viec;
      }
    }

    console.log('?? Final updateData after cleaning empty strings:', JSON.stringify(updateData, null, 2));

    const existingEmployee = await NhanVien.findById(req.params.id).populate(
      'thong_tin_cong_viec.trang_thai_lao_dong_id',
    );
    if (!existingEmployee) {
      console.log('? Employee not found:', req.params.id);
      return res.status(404).json({ msg: 'Kh�ng t�m th?y nh�n vi�n' });
    }

    const previousStatusName =
      existingEmployee.thong_tin_cong_viec?.trang_thai_lao_dong_id?.ten || '';
    let nextStatusName = previousStatusName;
    if (updateData.thong_tin_cong_viec?.trang_thai_lao_dong_id) {
      const statusDoc = await TrangThaiLaoDong.findById(
        updateData.thong_tin_cong_viec.trang_thai_lao_dong_id,
      ).select('ten');
      if (statusDoc?.ten) {
        nextStatusName = statusDoc.ten;
      }
    }
    const shouldTriggerOffboarding =
      !isTerminationStatus(previousStatusName) && isTerminationStatus(nextStatusName);
    const inferredLastWorkingDay =
      updateData.thong_tin_cong_viec?.ngay_nghi ||
      updateData.thong_tin_cong_viec?.ngay_thoi_viec ||
      existingEmployee.thong_tin_cong_viec?.ngay_nghi ||
      null;

    const nhanVien = await NhanVien.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!nhanVien) {
      console.log('? Employee not found:', req.params.id);
      return res.status(404).json({ msg: 'Kh�ng t�m th?y nh�n vi�n' });
    }

    if (shouldTriggerOffboarding) {
      await ensureOffboardingForEmployee(nhanVien, {
        lastWorkingDay: inferredLastWorkingDay,
        reason: `Trang thai cap nhat thanh: ${nextStatusName || 'khong ro'}`,
        requested_by: req.user?.id || null,
      });
    }


    console.log('✅ Employee updated successfully');
    res.json(nhanVien);
  } catch (err) {
    console.error('❌ Update employee error:', err.message);
    console.error('❌ Full error:', err);

    // Return detailed validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      console.error('❌ Validation errors:', errors);
      return res.status(400).json({
        msg: 'Dữ liệu không hợp lệ',
        errors,
        details: err.message
      });
    }

    // Handle cast errors (invalid ObjectId)
    if (err.name === 'CastError') {
      console.error('❌ Cast error:', err.path, err.value);
      return res.status(400).json({
        msg: 'ID không hợp lệ',
        error: `Trường ${err.path} có giá trị không đúng định dạng`,
        field: err.path
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      console.error('❌ Duplicate key:', field);
      return res.status(400).json({
        msg: 'Dữ liệu bị trùng lặp',
        error: `${field} đã tồn tại trong hệ thống`,
        field: field
      });
    }

    res.status(400).json({
      msg: 'Không thể cập nhật nhân viên',
      error: err.message,
      details: err.toString()
    });
  }
};

exports.deleteNhanVien = async (req, res) => {
  try {
    const nhanVien = await NhanVien.findByIdAndUpdate(
      req.params.id,
      { da_xoa: true },
      { new: true }
    );

    if (!nhanVien) {
      return res.status(404).json({ msg: 'Không tìm thấy nhân viên' });
    }

    res.json({ msg: 'Nhân viên đã được xóa thành công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

