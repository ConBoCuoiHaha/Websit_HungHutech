require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const config = require('./config');

const app = express();

// Import Routes
const authRoutes = require('./routes/auth.routes.js');
const nhanVienRoutes = require('./routes/nhanVien.routes.js');
const chucDanhRoutes = require('./routes/chucDanh.routes.js');
const trangThaiLaoDongRoutes = require('./routes/trangThaiLaoDong.routes.js');
const phongBanRoutes = require('./routes/phongBan.routes.js');
const diaDiemRoutes = require('./routes/diaDiem.routes.js');
const loaiNgayNghiRoutes = require('./routes/loaiNgayNghi.routes.js');
const quyenNghiPhepRoutes = require('./routes/quyenNghiPhep.routes.js');
const yeuCauNghiPhepRoutes = require('./routes/yeuCauNghiPhep.routes.js');
const chamCongRoutes = require('./routes/chamCong.routes.js');
const projectRoutes = require('./routes/project.routes.js');
const activityRoutes = require('./routes/activity.routes.js');
const timesheetRoutes = require('./routes/timesheet.routes.js');
const i18nRoutes = require('./routes/i18n.routes.js');
const uploadRoutes = require('./routes/upload.routes.js');
const ngayLeRoutes = require('./routes/ngayLe.routes.js');
const bacLuongRoutes = require('./routes/bacLuong.routes.js');
const caLamViecRoutes = require('./routes/caLamViec.routes.js');
const vacancyRoutes = require('./routes/vacancy.routes.js');
const candidateRoutes = require('./routes/candidate.routes.js');
const applicationRoutes = require('./routes/application.routes.js');
const interviewRoutes = require('./routes/interview.routes.js');
const kpiRoutes = require('./routes/kpi.routes.js');
const performanceReviewRoutes = require('./routes/performanceReview.routes.js');
const claimRoutes = require('./routes/claim.routes.js');
const buzzRoutes = require('./routes/buzz.routes.js');
const directoryRoutes = require('./routes/directory.routes.js');
const dashboardRoutes = require('./routes/dashboard.routes.js');
const reportRoutes = require('./routes/report.routes.js');
const adminConfigRoutes = require('./routes/adminConfig.routes.js');
const performanceTrackerRoutes = require('./routes/performanceTracker.routes.js');
const maintenanceRoutes = require('./routes/maintenance.routes.js');
const userRoutes = require('./routes/user.routes.js');

// CORS must be configured BEFORE helmet
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5000'],
  credentials: true,
  exposedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));

app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Hung-qlns';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => console.error('Could not connect to MongoDB.', err));

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Authentication middleware for protected routes
const { auth } = require('./utils/authHandler');
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  return auth(req, res, next);
});

// Protected API Routes
app.use('/api/nhanvien', nhanVienRoutes);
app.use('/api/chucdanh', chucDanhRoutes);
app.use('/api/trangthailaodong', trangThaiLaoDongRoutes);
app.use('/api/phongban', phongBanRoutes);
app.use('/api/diadiem', diaDiemRoutes);
app.use('/api/loaingaynghi', loaiNgayNghiRoutes);
app.use('/api/quyennghiphep', quyenNghiPhepRoutes);
app.use('/api/yeucaunghiphep', yeuCauNghiPhepRoutes);
app.use('/api/chamcong', chamCongRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ngay-le', ngayLeRoutes);
app.use('/api/bacluong', bacLuongRoutes);
app.use('/api/calamviec', caLamViecRoutes);
app.use('/api/recruitment/vacancies', vacancyRoutes);
app.use('/api/recruitment/candidates', candidateRoutes);
app.use('/api/recruitment/applications', applicationRoutes);
app.use('/api/recruitment/interviews', interviewRoutes);
app.use('/api/performance/kpis', kpiRoutes);
app.use('/api/performance/reviews', performanceReviewRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/buzz', buzzRoutes);
app.use('/api/directory', directoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminConfigRoutes);
app.use('/api/performance/trackers', performanceTrackerRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api', i18nRoutes);

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve resources statically (theo cấu trúc giảng viên)
app.use('/resources', express.static(path.join(__dirname, 'resources')));

// Serve public files
app.use(express.static(path.join(__dirname, 'public')));

// Error handlers (404 + generic error handler)
const { notFound, errorHandler } = require('./utils/errorHandler');
app.use('/api', notFound);
app.use('/api', errorHandler);

// Serve Frontend (Vue.js HRM App)
const frontendPath = path.join(__dirname, '../HungHutech-frontend/dist');
app.use(express.static(frontendPath));

// SPA fallback: Send all other non-API routes to index.html for Vue Router
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

module.exports = app;
