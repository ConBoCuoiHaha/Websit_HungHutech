const Report = require('../schemas/report.model');
const NhanVien = require('../schemas/nhanVien.model');
const ChamCong = require('../schemas/chamCong.model');
const YeuCauNghiPhep = require('../schemas/yeuCauNghiPhep.model');
const Claim = require('../schemas/claim.model');
const PerformanceReview = require('../schemas/performanceReview.model');
const { Parser } = require('json2csv');

// Helper function to build MongoDB query from criteria
const buildQueryFromCriteria = (tieu_chi) => {
  const query = {};

  tieu_chi.forEach((criteria) => {
    const { truong, dieu_kien, gia_tri } = criteria;

    switch (dieu_kien) {
      case '=':
        query[truong] = gia_tri;
        break;
      case '!=':
        query[truong] = { $ne: gia_tri };
        break;
      case '>':
        query[truong] = { $gt: gia_tri };
        break;
      case '<':
        query[truong] = { $lt: gia_tri };
        break;
      case '>=':
        query[truong] = { $gte: gia_tri };
        break;
      case '<=':
        query[truong] = { $lte: gia_tri };
        break;
      case 'LIKE':
        query[truong] = { $regex: gia_tri, $options: 'i' };
        break;
      case 'IN':
        query[truong] = { $in: Array.isArray(gia_tri) ? gia_tri : [gia_tri] };
        break;
      case 'NOT IN':
        query[truong] = { $nin: Array.isArray(gia_tri) ? gia_tri : [gia_tri] };
        break;
      case 'BETWEEN':
        if (Array.isArray(gia_tri) && gia_tri.length === 2) {
          query[truong] = { $gte: gia_tri[0], $lte: gia_tri[1] };
        }
        break;
      default:
        break;
    }
  });

  return query;
};

// Helper function to get model and populate based on report type
const getModelAndPopulate = (loai_bao_cao) => {
  let Model, populate = [];

  switch (loai_bao_cao) {
    case 'Nhan vien':
      Model = NhanVien;
      populate = [
        { path: 'thong_tin_cong_viec.chuc_danh_id', select: 'ten_chuc_danh' },
        { path: 'thong_tin_cong_viec.phong_ban_id', select: 'ten' },
        { path: 'thong_tin_cong_viec.trang_thai_lao_dong_id', select: 'ten' },
      ];
      break;
    case 'Cham cong':
      Model = ChamCong;
      populate = [
        { path: 'nhan_vien_id', select: 'ma_nhan_vien ho_dem ten' }
      ];
      break;
    case 'Nghi phep':
      Model = YeuCauNghiPhep;
      populate = [
        { path: 'nhan_vien_id', select: 'ma_nhan_vien ho_dem ten' },
        { path: 'loai_ngay_nghi_id', select: 'ten' },
        { path: 'nguoi_duyet_id', select: 'ma_nhan_vien ho_dem ten' }
      ];
      break;
    case 'Boi hoan':
      Model = Claim;
      populate = [
        { path: 'nhan_vien_id', select: 'ma_nhan_vien ho_dem ten' }
      ];
      break;
    case 'Hieu suat':
      Model = PerformanceReview;
      populate = [
        { path: 'nhan_vien_id', select: 'ma_nhan_vien ho_dem ten' },
        { path: 'nguoi_danh_gia_id', select: 'ma_nhan_vien ho_dem ten' },
        { path: 'ratings.kpi_id', select: 'ten' }
      ];
      break;
    default:
      throw new Error('Loại báo cáo không hợp lệ');
  }

  return { Model, populate };
};

// Get all saved reports
exports.getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, loai_bao_cao } = req.query;
    const query = loai_bao_cao ? { loai_bao_cao } : {};

    const skip = (page - 1) * limit;
    const reports = await Report.find(query)
      .populate('nguoi_tao_id', 'email')
      .sort({ ngay_cap_nhat: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Report.countDocuments(query);

    res.json({
      items: reports,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ msg: 'Lỗi khi lấy danh sách báo cáo', error: error.message });
  }
};

// Get report by ID
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('nguoi_tao_id', 'email');

    if (!report) {
      return res.status(404).json({ msg: 'Không tìm thấy báo cáo' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({ msg: 'Lỗi khi lấy báo cáo', error: error.message });
  }
};

// Create new report configuration
exports.createReport = async (req, res) => {
  try {
    const { ten_bao_cao, loai_bao_cao, tieu_chi, cot_hien_thi, sap_xep } = req.body;

    const report = new Report({
      ten_bao_cao,
      loai_bao_cao,
      tieu_chi: tieu_chi || [],
      cot_hien_thi: cot_hien_thi || [],
      sap_xep,
      nguoi_tao_id: req.user.id,
    });

    await report.save();
    await report.populate('nguoi_tao_id', 'email');

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ msg: 'Lỗi khi tạo báo cáo', error: error.message });
  }
};

// Update report configuration
exports.updateReport = async (req, res) => {
  try {
    const { ten_bao_cao, loai_bao_cao, tieu_chi, cot_hien_thi, sap_xep } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        ten_bao_cao,
        loai_bao_cao,
        tieu_chi,
        cot_hien_thi,
        sap_xep,
        ngay_cap_nhat: Date.now(),
      },
      { new: true, runValidators: true }
    ).populate('nguoi_tao_id', 'email');

    if (!report) {
      return res.status(404).json({ msg: 'Không tìm thấy báo cáo' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ msg: 'Lỗi khi cập nhật báo cáo', error: error.message });
  }
};

// Delete report
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: 'Không tìm thấy báo cáo' });
    }

    res.json({ msg: 'Xóa báo cáo thành công' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ msg: 'Lỗi khi xóa báo cáo', error: error.message });
  }
};

// Generate report data based on criteria
exports.generateReport = async (req, res) => {
  try {
    const { loai_bao_cao, tieu_chi, cot_hien_thi, sap_xep, page = 1, limit = 100 } = req.body;

    if (!loai_bao_cao) {
      return res.status(400).json({ msg: 'Loại báo cáo là bắt buộc' });
    }

    // Get model and populate based on report type
    const { Model, populate } = getModelAndPopulate(loai_bao_cao);

    // Build query from criteria
    const query = tieu_chi && tieu_chi.length > 0 ? buildQueryFromCriteria(tieu_chi) : {};

    // Build sort object
    let sort = { ngay_tao: -1 }; // Default sort
    if (sap_xep && sap_xep.truong) {
      sort = { [sap_xep.truong]: sap_xep.thu_tu === 'desc' ? -1 : 1 };
    }

    // Build select object for columns to display
    let select = {};
    if (cot_hien_thi && cot_hien_thi.length > 0) {
      cot_hien_thi.forEach(col => {
        select[col] = 1;
      });
    }

    // Execute query
    const skip = (page - 1) * limit;
    let queryBuilder = Model.find(query).sort(sort).limit(parseInt(limit)).skip(skip);

    // Apply populate
    if (populate.length > 0) {
      populate.forEach(pop => {
        queryBuilder = queryBuilder.populate(pop);
      });
    }

    // Apply select if specified
    if (Object.keys(select).length > 0) {
      queryBuilder = queryBuilder.select(select);
    }

    const data = await queryBuilder;
    const total = await Model.countDocuments(query);

    res.json({
      items: data,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      loai_bao_cao,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ msg: 'Lỗi khi tạo báo cáo', error: error.message });
  }
};

// Export report to CSV
exports.exportReportCSV = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: 'Không tìm thấy báo cáo' });
    }

    const { loai_bao_cao, tieu_chi, cot_hien_thi, sap_xep } = report;

    // Get model and populate based on report type
    const { Model, populate } = getModelAndPopulate(loai_bao_cao);

    // Build query from criteria
    const query = tieu_chi && tieu_chi.length > 0 ? buildQueryFromCriteria(tieu_chi) : {};

    // Build sort object
    let sort = { ngay_tao: -1 };
    if (sap_xep && sap_xep.truong) {
      sort = { [sap_xep.truong]: sap_xep.thu_tu === 'desc' ? -1 : 1 };
    }

    // Build select object
    let select = {};
    if (cot_hien_thi && cot_hien_thi.length > 0) {
      cot_hien_thi.forEach(col => {
        select[col] = 1;
      });
    }

    // Execute query
    let queryBuilder = Model.find(query).sort(sort).limit(10000); // Max 10k records for export

    // Apply populate
    if (populate.length > 0) {
      populate.forEach(pop => {
        queryBuilder = queryBuilder.populate(pop);
      });
    }

    // Apply select if specified
    if (Object.keys(select).length > 0) {
      queryBuilder = queryBuilder.select(select);
    }

    const data = await queryBuilder.lean();

    // Flatten nested objects for CSV
    const flattenedData = data.map(item => {
      const flat = {};
      Object.keys(item).forEach(key => {
        if (typeof item[key] === 'object' && item[key] !== null && !Array.isArray(item[key])) {
          if (item[key]._id) {
            // Handle populated references
            flat[key] = item[key].ten || item[key].ten_chuc_danh || item[key].ho_dem + ' ' + item[key].ten || item[key]._id;
          } else {
            // Handle nested objects
            Object.keys(item[key]).forEach(subKey => {
              flat[`${key}_${subKey}`] = item[key][subKey];
            });
          }
        } else if (Array.isArray(item[key])) {
          flat[key] = JSON.stringify(item[key]);
        } else {
          flat[key] = item[key];
        }
      });
      return flat;
    });

    // Convert to CSV
    const fields = cot_hien_thi && cot_hien_thi.length > 0 ? cot_hien_thi : Object.keys(flattenedData[0] || {});
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(flattenedData);

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-${report.ten_bao_cao}-${Date.now()}.csv"`);
    res.send('\uFEFF' + csv); // Add BOM for proper UTF-8 encoding in Excel
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ msg: 'Lỗi khi xuất báo cáo CSV', error: error.message });
  }
};
