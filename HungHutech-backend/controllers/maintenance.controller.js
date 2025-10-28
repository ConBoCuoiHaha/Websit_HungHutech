const NhanVien = require('../schemas/nhanVien.model.js');
const Candidate = require('../schemas/candidate.model.js');
const YeuCauNghiPhep = require('../schemas/yeuCauNghiPhep.model.js');
const ChamCong = require('../schemas/chamCong.model.js');
const Timesheet = require('../schemas/timesheet.model.js');
const PerformanceTracker = require('../schemas/performanceTracker.model.js');
const PerformanceReview = require('../schemas/performanceReview.model.js');
const Claim = require('../schemas/claim.model.js');
const Post = require('../schemas/post.model.js');
const Application = require('../schemas/application.model.js');
const Interview = require('../schemas/interview.model.js');
const PurgeLog = require('../schemas/purgeLog.model.js');
const mongoose = require('mongoose');

// Helper function to calculate retention period
const calculateRetentionPeriod = (date) => {
  if (!date) return null;
  const now = new Date();
  const diffTime = Math.abs(now - new Date(date));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffYears > 0) return `${diffYears} năm`;
  if (diffMonths > 0) return `${diffMonths} tháng`;
  return `${diffDays} ngày`;
};

// EMPLOYEE PURGE FUNCTIONS

/**
 * Get employees eligible for purge
 * Criteria: Employees marked as deleted (da_xoa: true) or terminated employment status
 * with retention period exceeded (e.g., 2 years since termination)
 */
exports.getEmployeesForPurge = async (req, res) => {
  try {
    const RETENTION_DAYS = 730; // 2 years default retention

    // Find employees marked as deleted or with specific employment status
    const employees = await NhanVien.find({ da_xoa: true })
      .populate('thong_tin_cong_viec.chuc_danh_id', 'ten_chuc_danh')
      .populate('thong_tin_cong_viec.trang_thai_lao_dong_id', 'ten')
      .populate('thong_tin_cong_viec.phong_ban_id', 'ten')
      .lean();

    const purgeableEmployees = await Promise.all(
      employees.map(async (emp) => {
        // Count related data
        const [
          leaveRequestsCount,
          attendanceCount,
          timesheetCount,
          performanceTrackerCount,
          performanceReviewCount,
          claimCount,
          postCount
        ] = await Promise.all([
          YeuCauNghiPhep.countDocuments({ nhan_vien_id: emp._id }),
          ChamCong.countDocuments({ nhan_vien_id: emp._id }),
          Timesheet.countDocuments({ nhan_vien_id: emp._id }),
          PerformanceTracker.countDocuments({
            $or: [
              { nhan_vien_id: emp._id },
              { nguoi_danh_gia_id: emp._id }
            ]
          }),
          PerformanceReview.countDocuments({
            $or: [
              { nhan_vien_id: emp._id },
              { nguoi_danh_gia_id: emp._id }
            ]
          }),
          Claim.countDocuments({ nhan_vien_id: emp._id }),
          Post.countDocuments({ tac_gia_id: emp._id })
        ]);

        const totalRelatedData =
          leaveRequestsCount +
          attendanceCount +
          timesheetCount +
          performanceTrackerCount +
          performanceReviewCount +
          claimCount +
          postCount;

        // Calculate days since deletion/termination
        const deletionDate = emp.ngay_cap_nhat || emp.ngay_tao;
        const daysSinceDeletion = Math.floor((Date.now() - new Date(deletionDate)) / (1000 * 60 * 60 * 24));

        // Determine reason for purgeable status
        let reason = '';
        if (emp.da_xoa && daysSinceDeletion >= RETENTION_DAYS) {
          reason = `Đã xóa mềm từ ${calculateRetentionPeriod(deletionDate)} trước (vượt quá thời hạn lưu trữ 2 năm)`;
        } else if (emp.da_xoa) {
          reason = `Đã xóa mềm từ ${calculateRetentionPeriod(deletionDate)} trước`;
        }

        return {
          ...emp,
          related_data_count: {
            total: totalRelatedData,
            leave_requests: leaveRequestsCount,
            attendance: attendanceCount,
            timesheets: timesheetCount,
            performance_trackers: performanceTrackerCount,
            performance_reviews: performanceReviewCount,
            claims: claimCount,
            posts: postCount
          },
          retention_period: calculateRetentionPeriod(deletionDate),
          days_since_deletion: daysSinceDeletion,
          reason,
          can_purge: daysSinceDeletion >= RETENTION_DAYS || emp.da_xoa
        };
      })
    );

    // Filter only employees that can be purged
    const filtered = purgeableEmployees.filter(emp => emp.can_purge);

    res.json({
      items: filtered,
      total: filtered.length,
      retention_policy_days: RETENTION_DAYS
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Lỗi khi lấy danh sách nhân viên có thể xóa', error: err.message });
  }
};

/**
 * Permanently purge an employee and all related data
 * This is a destructive operation that cannot be undone
 */
exports.purgeEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { ly_do } = req.body;

    if (!ly_do || ly_do.trim() === '') {
      return res.status(400).json({ msg: 'Vui lòng cung cấp lý do xóa' });
    }

    // Find employee
    const employee = await NhanVien.findById(id).session(session);
    if (!employee) {
      await session.abortTransaction();
      return res.status(404).json({ msg: 'Không tìm thấy nhân viên' });
    }

    const employeeName = `${employee.ho_dem} ${employee.ten}`;
    const employeeCode = employee.ma_nhan_vien;

    // Collect summary of data to be deleted
    const dataSummary = {
      ma_nhan_vien: employeeCode,
      ho_ten: employeeName,
      email: employee.lien_he?.email_cong_viec,
      deleted_records: {}
    };

    // Delete all related data
    const [
      leaveRequests,
      attendance,
      timesheets,
      performanceTrackers,
      performanceReviews,
      claims,
      posts
    ] = await Promise.all([
      YeuCauNghiPhep.deleteMany({ nhan_vien_id: id }).session(session),
      ChamCong.deleteMany({ nhan_vien_id: id }).session(session),
      Timesheet.deleteMany({ nhan_vien_id: id }).session(session),
      PerformanceTracker.deleteMany({
        $or: [
          { nhan_vien_id: id },
          { nguoi_danh_gia_id: id }
        ]
      }).session(session),
      PerformanceReview.deleteMany({
        $or: [
          { nhan_vien_id: id },
          { nguoi_danh_gia_id: id }
        ]
      }).session(session),
      Claim.deleteMany({ nhan_vien_id: id }).session(session),
      Post.deleteMany({ tac_gia_id: id }).session(session)
    ]);

    dataSummary.deleted_records = {
      yeu_cau_nghi_phep: leaveRequests.deletedCount,
      cham_cong: attendance.deletedCount,
      timesheets: timesheets.deletedCount,
      performance_trackers: performanceTrackers.deletedCount,
      performance_reviews: performanceReviews.deletedCount,
      claims: claims.deletedCount,
      buzz_posts: posts.deletedCount
    };

    // Delete the employee record itself
    await NhanVien.findByIdAndDelete(id).session(session);

    // Create purge log
    const purgeLog = new PurgeLog({
      loai: 'NhanVien',
      doi_tuong_id: id,
      ten_doi_tuong: employeeName,
      nguoi_thuc_hien_id: req.user.id,
      ly_do,
      du_lieu_lien_quan: dataSummary
    });
    await purgeLog.save({ session });

    await session.commitTransaction();

    res.json({
      msg: 'Đã xóa vĩnh viễn nhân viên và toàn bộ dữ liệu liên quan',
      summary: dataSummary
    });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).json({ msg: 'Lỗi khi xóa vĩnh viễn nhân viên', error: err.message });
  } finally {
    session.endSession();
  }
};

// CANDIDATE PURGE FUNCTIONS

/**
 * Get candidates eligible for purge
 * Criteria: Candidates with rejected status and retention period exceeded
 */
exports.getCandidatesForPurge = async (req, res) => {
  try {
    const RETENTION_DAYS = 365; // 1 year default retention for candidates

    // Find candidates marked as deleted or rejected
    const candidates = await Candidate.find({ da_xoa: true }).lean();

    const purgeableCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        // Count related data
        const [applicationsCount, interviewsCount] = await Promise.all([
          Application.countDocuments({ candidate_id: candidate._id }),
          Interview.countDocuments({ ung_vien_id: candidate._id })
        ]);

        // Get last application status
        const lastApplication = await Application.findOne({ candidate_id: candidate._id })
          .sort({ ngay_cap_nhat: -1 })
          .lean();

        const totalRelatedData = applicationsCount + interviewsCount;

        // Calculate days since last update
        const lastUpdateDate = candidate.ngay_cap_nhat || candidate.ngay_tao;
        const daysSinceUpdate = Math.floor((Date.now() - new Date(lastUpdateDate)) / (1000 * 60 * 60 * 24));

        // Determine reason
        let reason = '';
        let status = lastApplication?.trang_thai || 'Không rõ';

        if (candidate.da_xoa && daysSinceUpdate >= RETENTION_DAYS) {
          reason = `Đã xóa mềm từ ${calculateRetentionPeriod(lastUpdateDate)} trước (vượt quá thời hạn lưu trữ 1 năm)`;
        } else if (candidate.da_xoa) {
          reason = `Đã xóa mềm từ ${calculateRetentionPeriod(lastUpdateDate)} trước`;
        } else if (status === 'Tu choi' && daysSinceUpdate >= RETENTION_DAYS) {
          reason = `Đã bị từ chối từ ${calculateRetentionPeriod(lastUpdateDate)} trước`;
        }

        return {
          ...candidate,
          last_status: status,
          related_data_count: {
            total: totalRelatedData,
            applications: applicationsCount,
            interviews: interviewsCount
          },
          retention_period: calculateRetentionPeriod(lastUpdateDate),
          days_since_update: daysSinceUpdate,
          reason,
          can_purge: daysSinceUpdate >= RETENTION_DAYS || candidate.da_xoa
        };
      })
    );

    const filtered = purgeableCandidates.filter(c => c.can_purge);

    res.json({
      items: filtered,
      total: filtered.length,
      retention_policy_days: RETENTION_DAYS
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Lỗi khi lấy danh sách ứng viên có thể xóa', error: err.message });
  }
};

/**
 * Permanently purge a candidate and all related data
 */
exports.purgeCandidate = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { ly_do } = req.body;

    if (!ly_do || ly_do.trim() === '') {
      return res.status(400).json({ msg: 'Vui lòng cung cấp lý do xóa' });
    }

    // Find candidate
    const candidate = await Candidate.findById(id).session(session);
    if (!candidate) {
      await session.abortTransaction();
      return res.status(404).json({ msg: 'Không tìm thấy ứng viên' });
    }

    const candidateName = candidate.ho_ten;

    // Collect summary
    const dataSummary = {
      ho_ten: candidateName,
      email: candidate.email,
      dien_thoai: candidate.dien_thoai,
      deleted_records: {}
    };

    // Delete related data
    const [applications, interviews] = await Promise.all([
      Application.deleteMany({ candidate_id: id }).session(session),
      Interview.deleteMany({ ung_vien_id: id }).session(session)
    ]);

    dataSummary.deleted_records = {
      applications: applications.deletedCount,
      interviews: interviews.deletedCount
    };

    // Delete the candidate record
    await Candidate.findByIdAndDelete(id).session(session);

    // Create purge log
    const purgeLog = new PurgeLog({
      loai: 'UngVien',
      doi_tuong_id: id,
      ten_doi_tuong: candidateName,
      nguoi_thuc_hien_id: req.user.id,
      ly_do,
      du_lieu_lien_quan: dataSummary
    });
    await purgeLog.save({ session });

    await session.commitTransaction();

    res.json({
      msg: 'Đã xóa vĩnh viễn ứng viên và toàn bộ dữ liệu liên quan',
      summary: dataSummary
    });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).json({ msg: 'Lỗi khi xóa vĩnh viễn ứng viên', error: err.message });
  } finally {
    session.endSession();
  }
};

// AUDIT LOG FUNCTIONS

/**
 * Get purge logs for audit purposes
 */
exports.getPurgeLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, loai, nguoi_thuc_hien_id, tu_ngay, den_ngay } = req.query;

    const filter = {};

    if (loai) {
      filter.loai = loai;
    }

    if (nguoi_thuc_hien_id) {
      filter.nguoi_thuc_hien_id = nguoi_thuc_hien_id;
    }

    if (tu_ngay || den_ngay) {
      filter.ngay_thuc_hien = {};
      if (tu_ngay) filter.ngay_thuc_hien.$gte = new Date(tu_ngay);
      if (den_ngay) filter.ngay_thuc_hien.$lte = new Date(den_ngay);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      PurgeLog.find(filter)
        .populate('nguoi_thuc_hien_id', 'email')
        .sort({ ngay_thuc_hien: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PurgeLog.countDocuments(filter)
    ]);

    res.json({
      items,
      page: parseInt(page),
      limit: parseInt(limit),
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Lỗi khi lấy lịch sử purge', error: err.message });
  }
};
