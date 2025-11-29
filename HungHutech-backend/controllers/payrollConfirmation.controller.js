const mongoose = require('mongoose');
const PayrollRun = require('../schemas/payrollRun.model');
const NhanVien = require('../schemas/nhanVien.model');
const User = require('../schemas/user.model');

/**
 * API 1: Gửi bảng lương cho nhân viên xác nhận
 * POST /api/payroll/runs/:runId/send-confirmations
 * Role: Admin, Manager
 */
exports.sendConfirmations = async (req, res) => {
  try {
    const { runId } = req.params;
    const { entry_ids, ghi_chu } = req.body;
    const userId = req.user.id || req.user._id;

    console.log('=== sendConfirmations ===');
    console.log('runId:', runId);
    console.log('entry_ids:', entry_ids);
    console.log('userId:', userId);

    // Validate run exists
    const run = await PayrollRun.findById(runId);
    if (!run) {
      return res.status(404).json({ msg: 'Không tìm thấy bảng lương' });
    }

    // Get user info for logging
    const user = await User.findById(userId).populate('nhan_vien_id');
    const nguoiGuiTen = user?.nhan_vien_id?.ho_ten || 'Admin';

    // Calculate deadline: now + 3 days
    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 3);

    let sentCount = 0;
    let failedCount = 0;

    // Update each entry
    for (const entryId of entry_ids) {
      try {
        const entry = run.entries.id(entryId);
        if (!entry) {
          console.log(`Entry ${entryId} not found`);
          failedCount++;
          continue;
        }

        // Only send if not already confirmed
        if (entry.trang_thai_xac_nhan === 'Da_xac_nhan') {
          console.log(`Entry ${entryId} already confirmed, skipping`);
          failedCount++;
          continue;
        }

        // Update entry
        entry.trang_thai_xac_nhan = 'Cho_xac_nhan';
        entry.gui_xac_nhan = {
          ngay_gui: now,
          nguoi_gui_id: userId,
          nguoi_gui_ten: nguoiGuiTen,
          deadline: deadline,
        };

        // Add to history
        if (!entry.lich_su_xac_nhan) {
          entry.lich_su_xac_nhan = [];
        }
        entry.lich_su_xac_nhan.push({
          hanh_dong: 'gui_xac_nhan',
          ngay: now,
          nguoi_thuc_hien_id: userId,
          nguoi_thuc_hien_ten: nguoiGuiTen,
          ghi_chu: ghi_chu || `Gửi xác nhận bảng lương ${run.ky_luong}`,
        });

        sentCount++;
        console.log(`Sent confirmation for entry ${entryId}`);
      } catch (err) {
        console.error(`Error sending confirmation for entry ${entryId}:`, err);
        failedCount++;
      }
    }

    // Save the run
    await run.save();

    console.log(`Sent ${sentCount} confirmations, failed ${failedCount}`);

    return res.status(200).json({
      success: true,
      msg: `Đã gửi bảng lương cho ${sentCount} nhân viên`,
      data: {
        sent_count: sentCount,
        failed_count: failedCount,
        deadline: deadline.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error in sendConfirmations:', err);
    return res.status(500).json({ msg: 'Lỗi server', error: err.message });
  }
};

/**
 * API 2: Lấy danh sách bảng lương chờ xác nhận (cho Mobile)
 * GET /api/payroll/entries/my-pending
 * Role: Employee
 */
exports.getMyPendingPayrolls = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id; // JWT uses 'id', not '_id'
    const { trang_thai, limit = 10, page = 1 } = req.query;

    console.log('=== getMyPendingPayrolls ===');
    console.log('req.user:', req.user);
    console.log('userId:', userId);
    console.log('trang_thai:', trang_thai);

    // Get employee ID from user
    const user = await User.findById(userId).populate('nhan_vien_id');
    console.log('user found:', user ? 'YES' : 'NO');
    console.log('user.nhan_vien_id:', user ? user.nhan_vien_id : 'N/A');
    console.log('user email:', user ? user.email : 'N/A');

    if (!user || !user.nhan_vien_id) {
      console.log('❌ 404 Error: User has no nhan_vien_id link');
      return res.status(404).json({ msg: 'Không tìm thấy thông tin nhân viên' });
    }

    const nhanVienId = user.nhan_vien_id._id;
    console.log('nhanVienId:', nhanVienId);

    // Build query
    const query = {
      'entries.nhan_vien_id': nhanVienId,
    };

    if (trang_thai) {
      query['entries.trang_thai_xac_nhan'] = trang_thai;
    }

    // Find runs containing this employee
    const runs = await PayrollRun.find(query)
      .select('ky_luong ngay_bat_dau ngay_ket_thuc loai_ky entries')
      .sort({ ngay_tao: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Extract only this employee's entries
    const results = [];
    for (const run of runs) {
      for (const entry of run.entries) {
        if (entry.nhan_vien_id.toString() === nhanVienId.toString()) {
          // Filter by status if specified
          if (!trang_thai || entry.trang_thai_xac_nhan === trang_thai) {
            results.push({
              _id: entry._id,
              run_id: run._id,
              ky_luong: run.ky_luong,
              ngay_bat_dau: run.ngay_bat_dau,
              ngay_ket_thuc: run.ngay_ket_thuc,
              loai_ky: run.loai_ky,

              // Salary details
              luong_co_ban: entry.luong_co_ban,
              phu_cap: entry.phu_cap || [],
              thuong: entry.thuong || [],
              ot: entry.ot || [],
              khoan_khau_tru: entry.khoan_khau_tru || [],
              tong_phu_cap: entry.tong_phu_cap || 0,
              tong_thuong: entry.tong_thuong || 0,
              tong_ot: entry.tong_ot || 0,
              tong_khau_tru_khac: entry.tong_khau_tru_khac || 0,
              tong_thu_nhap: entry.tong_thu_nhap || 0,

              // Insurance
              bhxh: entry.bhxh || 0,
              bhyt: entry.bhyt || 0,
              bhtn: entry.bhtn || 0,
              kpcd: entry.kpcd || 0,
              tong_khau_tru_bat_buoc: entry.tong_khau_tru_bat_buoc || 0,

              // Tax
              giam_tru_ban_than: entry.giam_tru_ban_than || 0,
              giam_tru_phu_thuoc: entry.giam_tru_phu_thuoc || 0,
              so_nguoi_phu_thuoc: entry.so_nguoi_phu_thuoc || 0,
              thu_nhap_tinh_thue: entry.thu_nhap_tinh_thue || 0,
              thue_tncn: entry.thue_tncn || 0,
              chi_tiet_thue: entry.chi_tiet_thue || [],

              // Final
              tong_khau_tru: entry.tong_khau_tru || 0,
              luong_thuc_nhan: entry.luong_thuc_nhan || 0,

              // Confirmation status
              trang_thai_xac_nhan: entry.trang_thai_xac_nhan,
              gui_xac_nhan: entry.gui_xac_nhan || null,
              xac_nhan: entry.xac_nhan || null,
              tu_choi: entry.tu_choi || null,
            });
          }
        }
      }
    }

    // Count total for pagination
    const total = results.length;

    return res.status(200).json({
      success: true,
      data: results,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Error in getMyPendingPayrolls:', err);
    return res.status(500).json({ msg: 'Lỗi server', error: err.message });
  }
};

/**
 * API 3: Nhân viên xác nhận bảng lương
 * POST /api/payroll/entries/:entryId/confirm
 * Role: Employee
 */
exports.confirmPayroll = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { biometric_signature, device_info, os_version, app_version, device_id } = req.body;
    const userId = req.user.id || req.user._id;

    console.log('=== confirmPayroll ===');
    console.log('entryId:', entryId);
    console.log('userId:', userId);
    console.log('device_id:', device_id);

    // Get employee info
    const user = await User.findById(userId).populate('nhan_vien_id');
    if (!user || !user.nhan_vien_id) {
      return res.status(404).json({ msg: 'Không tìm thấy thông tin nhân viên' });
    }

    // VERIFY BIOMETRIC
    // Check if user has registered biometric
    if (!user.biometric_device || !user.biometric_device.fingerprint_signature) {
      console.log('❌ User has not registered biometric yet');
      return res.status(403).json({
        success: false,
        msg: 'Bạn chưa đăng ký vân tay. Vui lòng đăng ký vân tay trước khi xác nhận lương.',
        needs_biometric_registration: true,
      });
    }

    // Verify device ID matches
    if (device_id && user.biometric_device.device_id !== device_id) {
      console.log('❌ Device ID mismatch');
      console.log('Registered device:', user.biometric_device.device_id);
      console.log('Current device:', device_id);
      return res.status(403).json({
        success: false,
        msg: 'Thiết bị không khớp. Bạn chỉ có thể xác nhận lương trên thiết bị đã đăng ký vân tay.',
        registered_device: user.biometric_device.device_name,
      });
    }

    // Verify fingerprint signature matches
    if (biometric_signature && user.biometric_device.fingerprint_signature !== biometric_signature) {
      console.log('❌ Fingerprint signature mismatch');
      return res.status(403).json({
        success: false,
        msg: 'Vân tay không khớp với vân tay đã đăng ký. Vui lòng sử dụng đúng vân tay đã đăng ký hoặc đăng ký lại.',
      });
    }

    console.log('✅ Biometric verification passed');

    // Update biometric last used time
    user.biometric_device.last_used_at = new Date();
    await user.save();

    const nhanVienId = user.nhan_vien_id._id;
    const nhanVienTen = user.nhan_vien_id.ho_ten;

    // Find the run containing this entry
    const run = await PayrollRun.findOne({ 'entries._id': entryId });
    if (!run) {
      return res.status(404).json({ msg: 'Không tìm thấy bảng lương' });
    }

    const entry = run.entries.id(entryId);
    if (!entry) {
      return res.status(404).json({ msg: 'Không tìm thấy phiếu lương' });
    }

    // Validate: entry belongs to this employee
    if (entry.nhan_vien_id.toString() !== nhanVienId.toString()) {
      return res.status(403).json({ msg: 'Bạn không có quyền xác nhận phiếu lương này' });
    }

    // Validate: status must be Cho_xac_nhan
    if (entry.trang_thai_xac_nhan !== 'Cho_xac_nhan') {
      return res.status(400).json({
        msg: 'Phiếu lương không ở trạng thái chờ xác nhận',
        current_status: entry.trang_thai_xac_nhan,
      });
    }

    // Validate: not past deadline
    if (entry.gui_xac_nhan && entry.gui_xac_nhan.deadline) {
      if (new Date() > new Date(entry.gui_xac_nhan.deadline)) {
        return res.status(400).json({ msg: 'Đã quá hạn xác nhận' });
      }
    }

    const now = new Date();

    // Update entry
    entry.trang_thai_xac_nhan = 'Da_xac_nhan';
    entry.xac_nhan = {
      da_xac_nhan: true,
      ngay_xac_nhan: now,
      biometric_signature: biometric_signature || '',
      device_info: device_info || '',
      ip_address: req.ip || req.connection.remoteAddress || '',
    };

    // Add to history
    if (!entry.lich_su_xac_nhan) {
      entry.lich_su_xac_nhan = [];
    }
    entry.lich_su_xac_nhan.push({
      hanh_dong: 'xac_nhan',
      ngay: now,
      nguoi_thuc_hien_id: nhanVienId,
      nguoi_thuc_hien_ten: nhanVienTen,
      ghi_chu: `Xác nhận qua app mobile - ${device_info}`,
    });

    await run.save();

    console.log(`Entry ${entryId} confirmed by employee ${nhanVienId}`);

    return res.status(200).json({
      success: true,
      msg: 'Xác nhận bảng lương thành công',
      data: {
        entry_id: entry._id,
        trang_thai_xac_nhan: entry.trang_thai_xac_nhan,
        ngay_xac_nhan: entry.xac_nhan.ngay_xac_nhan,
        luong_thuc_nhan: entry.luong_thuc_nhan,
      },
    });
  } catch (err) {
    console.error('Error in confirmPayroll:', err);
    return res.status(500).json({ msg: 'Lỗi server', error: err.message });
  }
};

/**
 * API 4: Nhân viên từ chối bảng lương
 * POST /api/payroll/entries/:entryId/reject
 * Role: Employee
 */
exports.rejectPayroll = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { ly_do, ghi_chu, device_info } = req.body;
    const userId = req.user.id || req.user._id;

    console.log('=== rejectPayroll ===');
    console.log('entryId:', entryId);
    console.log('ly_do:', ly_do);

    // Validate input
    if (!ly_do || ly_do.trim().length < 10) {
      return res.status(400).json({ msg: 'Lý do từ chối phải có ít nhất 10 ký tự' });
    }

    // Get employee info
    const user = await User.findById(userId).populate('nhan_vien_id');
    if (!user || !user.nhan_vien_id) {
      return res.status(404).json({ msg: 'Không tìm thấy thông tin nhân viên' });
    }

    const nhanVienId = user.nhan_vien_id._id;
    const nhanVienTen = user.nhan_vien_id.ho_ten;

    // Find the run containing this entry
    const run = await PayrollRun.findOne({ 'entries._id': entryId });
    if (!run) {
      return res.status(404).json({ msg: 'Không tìm thấy bảng lương' });
    }

    const entry = run.entries.id(entryId);
    if (!entry) {
      return res.status(404).json({ msg: 'Không tìm thấy phiếu lương' });
    }

    // Validate: entry belongs to this employee
    if (entry.nhan_vien_id.toString() !== nhanVienId.toString()) {
      return res.status(403).json({ msg: 'Bạn không có quyền từ chối phiếu lương này' });
    }

    // Validate: status must be Cho_xac_nhan
    if (entry.trang_thai_xac_nhan !== 'Cho_xac_nhan') {
      return res.status(400).json({
        msg: 'Phiếu lương không ở trạng thái chờ xác nhận',
        current_status: entry.trang_thai_xac_nhan,
      });
    }

    const now = new Date();

    // Update entry
    entry.trang_thai_xac_nhan = 'Tu_choi';
    entry.tu_choi = {
      ly_do: ly_do.trim(),
      ngay_tu_choi: now,
      ghi_chu: ghi_chu || '',
      da_xu_ly: false,
    };

    // Add to history
    if (!entry.lich_su_xac_nhan) {
      entry.lich_su_xac_nhan = [];
    }
    entry.lich_su_xac_nhan.push({
      hanh_dong: 'tu_choi',
      ngay: now,
      nguoi_thuc_hien_id: nhanVienId,
      nguoi_thuc_hien_ten: nhanVienTen,
      ghi_chu: `Lý do: ${ly_do}`,
    });

    await run.save();

    console.log(`Entry ${entryId} rejected by employee ${nhanVienId}`);

    // TODO: Send notification to HR/Admin
    // This would integrate with your notification system

    return res.status(200).json({
      success: true,
      msg: 'Đã gửi khiếu nại tới bộ phận nhân sự',
      data: {
        entry_id: entry._id,
        trang_thai_xac_nhan: entry.trang_thai_xac_nhan,
        ngay_tu_choi: entry.tu_choi.ngay_tu_choi,
      },
    });
  } catch (err) {
    console.error('Error in rejectPayroll:', err);
    return res.status(500).json({ msg: 'Lỗi server', error: err.message });
  }
};

/**
 * API 5: Lấy danh sách bảng lương Final (cho HR)
 * GET /api/payroll/runs/:runId/confirmations
 * Role: Admin, Manager
 */
exports.getConfirmations = async (req, res) => {
  try {
    const { runId } = req.params;
    const { trang_thai_xac_nhan } = req.query;

    console.log('=== getConfirmations ===');
    console.log('runId:', runId);
    console.log('filter trang_thai_xac_nhan:', trang_thai_xac_nhan);

    const run = await PayrollRun.findById(runId).populate('entries.nhan_vien_id', 'ma_nhan_vien ho_dem ten ho_ten');
    if (!run) {
      return res.status(404).json({ msg: 'Không tìm thấy bảng lương' });
    }

    // Filter entries if status specified
    let entries = run.entries;
    if (trang_thai_xac_nhan) {
      entries = entries.filter(e => e.trang_thai_xac_nhan === trang_thai_xac_nhan);
    }

    // Calculate statistics
    const thong_ke = {
      da_xac_nhan: run.entries.filter(e => e.trang_thai_xac_nhan === 'Da_xac_nhan').length,
      tu_choi: run.entries.filter(e => e.trang_thai_xac_nhan === 'Tu_choi').length,
      cho_xac_nhan: run.entries.filter(e => e.trang_thai_xac_nhan === 'Cho_xac_nhan').length,
      chua_gui: run.entries.filter(e => e.trang_thai_xac_nhan === 'Chua_gui').length,
    };

    // Format entries for response
    const formattedEntries = entries.map(entry => ({
      _id: entry._id,
      ma_nhan_vien: entry.ma_nhan_vien,
      ho_ten: entry.ho_ten,
      nhan_vien_id: entry.nhan_vien_id, // Include populated employee data
      luong_thuc_nhan: entry.luong_thuc_nhan,
      trang_thai_xac_nhan: entry.trang_thai_xac_nhan,
      gui_xac_nhan: entry.gui_xac_nhan || null,
      xac_nhan: entry.xac_nhan || null,
      tu_choi: entry.tu_choi || null,
      lich_su_xac_nhan: entry.lich_su_xac_nhan || [],
    }));

    return res.status(200).json({
      success: true,
      data: {
        run: run, // Return full run object for website frontend
        entries: formattedEntries,
        thong_ke,
      },
    });
  } catch (err) {
    console.error('Error in getConfirmations:', err);
    return res.status(500).json({ msg: 'Lỗi server', error: err.message });
  }
};

/**
 * API 6: HR xử lý khiếu nại và gửi lại
 * PUT /api/payroll/entries/:entryId/resolve-rejection
 * Role: Admin, Manager
 */
exports.resolveRejection = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { ket_qua_xu_ly, updated_entry, gui_lai } = req.body;
    const userId = req.user.id || req.user._id;

    console.log('=== resolveRejection ===');
    console.log('entryId:', entryId);
    console.log('gui_lai:', gui_lai);

    // Get user info
    const user = await User.findById(userId).populate('nhan_vien_id');
    const nguoiXuLyTen = user?.nhan_vien_id?.ho_ten || 'Admin';

    // Find the run
    const run = await PayrollRun.findOne({ 'entries._id': entryId });
    if (!run) {
      return res.status(404).json({ msg: 'Không tìm thấy bảng lương' });
    }

    const entry = run.entries.id(entryId);
    if (!entry) {
      return res.status(404).json({ msg: 'Không tìm thấy phiếu lương' });
    }

    // Validate: must be in Tu_choi status
    if (entry.trang_thai_xac_nhan !== 'Tu_choi') {
      return res.status(400).json({ msg: 'Phiếu lương không ở trạng thái từ chối' });
    }

    const now = new Date();

    // Update rejection info
    if (!entry.tu_choi) {
      entry.tu_choi = {};
    }
    entry.tu_choi.da_xu_ly = true;
    entry.tu_choi.nguoi_xu_ly_id = userId;
    entry.tu_choi.ngay_xu_ly = now;
    entry.tu_choi.ket_qua_xu_ly = ket_qua_xu_ly || '';

    // If updated_entry provided, update the entry data
    if (updated_entry) {
      // Update entry fields (be careful with what's allowed to update)
      if (updated_entry.phu_cap) entry.phu_cap = updated_entry.phu_cap;
      if (updated_entry.thuong) entry.thuong = updated_entry.thuong;
      if (updated_entry.ot) entry.ot = updated_entry.ot;
      if (updated_entry.khoan_khau_tru) entry.khoan_khau_tru = updated_entry.khoan_khau_tru;
      if (updated_entry.so_nguoi_phu_thuoc !== undefined) entry.so_nguoi_phu_thuoc = updated_entry.so_nguoi_phu_thuoc;

      // Recalculate totals
      const { calculatePayrollEntry } = require('../utils/payrollEngine');
      const settings = run.settings || {};

      const recalculated = calculatePayrollEntry(
        {
          luong_co_ban: entry.luong_co_ban,
          so_nguoi_phu_thuoc: entry.so_nguoi_phu_thuoc || 0,
          so_ngay_cong: entry.metadata?.so_ngay_cong || 22,
          phu_cap: entry.phu_cap || [],
          thuong: entry.thuong || [],
          ot: entry.ot || [],
          khoan_khau_tru: entry.khoan_khau_tru || [],
        },
        settings,
        {}
      );

      // Update calculated fields
      entry.tong_phu_cap = recalculated.tong_phu_cap || 0;
      entry.tong_thuong = recalculated.tong_thuong || 0;
      entry.tong_ot = recalculated.tong_ot || 0;
      entry.tong_khau_tru_khac = recalculated.tong_khau_tru_khac || 0;
      entry.tong_thu_nhap = recalculated.tong_thu_nhap || 0;
      entry.bhxh = recalculated.bhxh || 0;
      entry.bhyt = recalculated.bhyt || 0;
      entry.bhtn = recalculated.bhtn || 0;
      entry.kpcd = recalculated.kpcd || 0;
      entry.tong_khau_tru_bat_buoc = recalculated.tong_khau_tru_bat_buoc || 0;
      entry.giam_tru_phu_thuoc = recalculated.giam_tru_phu_thuoc || 0;
      entry.thu_nhap_tinh_thue = recalculated.thu_nhap_tinh_thue || 0;
      entry.thue_tncn = recalculated.thue_tncn || 0;
      entry.chi_tiet_thue = recalculated.chi_tiet_thue || [];
      entry.tong_khau_tru = recalculated.tong_khau_tru || 0;
      entry.luong_thuc_nhan = recalculated.luong_thuc_nhan || 0;
    }

    // If gui_lai = true, reset to Cho_xac_nhan and set new deadline
    if (gui_lai) {
      entry.trang_thai_xac_nhan = 'Cho_xac_nhan';

      const newDeadline = new Date(now);
      newDeadline.setDate(newDeadline.getDate() + 3);

      if (!entry.gui_xac_nhan) {
        entry.gui_xac_nhan = {};
      }
      entry.gui_xac_nhan.ngay_gui = now;
      entry.gui_xac_nhan.nguoi_gui_id = userId;
      entry.gui_xac_nhan.nguoi_gui_ten = nguoiXuLyTen;
      entry.gui_xac_nhan.deadline = newDeadline;

      // Add to history
      if (!entry.lich_su_xac_nhan) {
        entry.lich_su_xac_nhan = [];
      }
      entry.lich_su_xac_nhan.push({
        hanh_dong: 'gui_lai',
        ngay: now,
        nguoi_thuc_hien_id: userId,
        nguoi_thuc_hien_ten: nguoiXuLyTen,
        ghi_chu: `Đã xử lý khiếu nại và gửi lại. ${ket_qua_xu_ly}`,
      });
    } else {
      // Just mark as resolved without resending
      if (!entry.lich_su_xac_nhan) {
        entry.lich_su_xac_nhan = [];
      }
      entry.lich_su_xac_nhan.push({
        hanh_dong: 'xu_ly_tu_choi',
        ngay: now,
        nguoi_thuc_hien_id: userId,
        nguoi_thuc_hien_ten: nguoiXuLyTen,
        ghi_chu: ket_qua_xu_ly || 'Đã xử lý khiếu nại',
      });
    }

    await run.save();

    console.log(`Entry ${entryId} rejection resolved by ${userId}`);

    // TODO: Send notification to employee if gui_lai = true

    return res.status(200).json({
      success: true,
      msg: gui_lai ? 'Đã cập nhật và gửi lại bảng lương' : 'Đã xử lý khiếu nại',
      data: {
        entry_id: entry._id,
        luong_thuc_nhan_moi: entry.luong_thuc_nhan,
        trang_thai_xac_nhan: entry.trang_thai_xac_nhan,
      },
    });
  } catch (err) {
    console.error('Error in resolveRejection:', err);
    return res.status(500).json({ msg: 'Lỗi server', error: err.message });
  }
};

module.exports = exports;
