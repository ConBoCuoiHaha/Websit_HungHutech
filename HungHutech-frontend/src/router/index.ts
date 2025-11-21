import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import {isAuthenticated} from '@/modules/auth/services/auth.service';

const routes: Array<RouteRecordRaw> = [
  // Auth Routes
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: {requiresGuest: true},
  },
  {
    path: '/login',
    redirect: '/auth/login',
  },
  {
    path: '/auth/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/modules/auth/pages/ForgotPassword.vue'),
    meta: {requiresGuest: true},
  },

  // Main Application Routes
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: {requiresAuth: true},
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/Dashboard.vue'),
      },
      {
        path: 'nhan-vien',
        name: 'NhanVien',
        component: () => import('@/pages/NhanVienList.vue'),
      },
      {
        path: 'nhan-vien/them',
        name: 'EmployeeCreate',
        component: () => import('@/pages/EmployeeForm.vue'),
      },
      {
        path: 'nhan-vien/:id/edit',
        name: 'EmployeeEdit',
        component: () => import('@/pages/EmployeeForm.vue'),
      },
      {
        path: 'nhan-vien/:id',
        name: 'EmployeeDetail',
        component: () => import('@/pages/EmployeeDetail.vue'),
      },
      {
        path: 'ho-so-nhan-su',
        name: 'EmployeeDocuments',
        component: () => import('@/pages/EmployeeDocuments.vue'),
        meta: {requiresRole: ['admin', 'manager']},
      },
      {
        path: 'hop-dong',
        name: 'ContractList',
        component: () => import('@/pages/ContractList.vue'),
        meta: {requiresRole: ['admin', 'manager']},
      },
      {
        path: 'pim/yeu-cau-cap-nhat',
        name: 'ProfileRequestApproval',
        component: () => import('@/pages/ProfileRequestApproval.vue'),
        meta: {requiresRole: ['admin', 'manager']},
      },
      {
        path: 'chuc-danh',
        name: 'ChucDanh',
        component: () => import('@/pages/ChucDanhList.vue'),
      },
      {
        path: 'phong-ban',
        name: 'PhongBan',
        component: () => import('@/pages/PhongBanList.vue'),
      },
      // My Info Route
      {
        path: 'thong-tin-cua-toi',
        name: 'MyInfo',
        component: () => import('@/pages/MyInfo.vue'),
      },
      // Corporate Directory
      {
        path: 'danh-ba',
        name: 'CorporateDirectory',
        component: () => import('@/pages/CorporateDirectory.vue'),
      },
      // Leave Management Routes
      {
        path: 'nghi-phep',
        name: 'LeaveList',
        component: () => import('@/pages/LeaveList.vue'),
      },
      {
        path: 'nghi-phep/so-du',
        name: 'LeaveBalance',
        component: () => import('@/pages/LeaveBalance.vue'),
      },
      {
        path: 'nghi-phep/phe-duyet',
        name: 'LeaveApproval',
        component: () => import('@/pages/LeaveApproval.vue'),
        meta: {requiresAuth: true, requiresRole: ['admin', 'manager']},
      },
      {
        path: 'tang-ca/duyet',
        name: 'OvertimeApproval',
        component: () => import('@/pages/OvertimeApproval.vue'),
        meta: {requiresAuth: true, requiresRole: ['admin', 'manager']},
      },
      {
        path: 'thoi-gian/rule-engine',
        name: 'TimeRuleEngine',
        component: () => import('@/pages/TimeRuleEngine.vue'),
        meta: {requiresRole: ['admin', 'manager']},
      },
      {
        path: 'thoi-gian/phan-ca',
        name: 'ShiftAssignment',
        component: () => import('@/pages/ShiftAssignmentPage.vue'),
        meta: {requiresRole: ['admin', 'manager']},
      },
      {
        path: 'nghi-phep/loai',
        name: 'LeaveTypeList',
        component: () => import('@/pages/LeaveTypeList.vue'),
      },
      {
        path: 'nghi-phep/quyen',
        name: 'LeaveEntitlementList',
        component: () => import('@/pages/LeaveEntitlementList.vue'),
      },
      {
        path: 'nghi-phep/gan-phep',
        name: 'LeaveAssign',
        component: () => import('@/pages/LeaveAssign.vue'),
        meta: {requiresAuth: true, requiresRole: ['admin', 'manager']},
      },
      {
        path: 'nghi-phep/ngay-le',
        name: 'HolidayList',
        component: () => import('@/pages/HolidayList.vue'),
      },
      // Attendance Routes
      {
        path: 'cham-cong',
        name: 'AttendanceDaily',
        component: () => import('@/pages/AttendanceDaily.vue'),
      },
      {
        path: 'cham-cong/bang-cong',
        name: 'AttendanceSheet',
        component: () => import('@/pages/AttendanceSheet.vue'),
      },
      {
        path: 'luong/bang-luong',
        name: 'PayrollRuns',
        component: () => import('@/pages/PayrollRunList.vue'),
        meta: {requiresRole: ['admin', 'manager']},
      },
      {
        path: 'ca-lam-viec',
        name: 'WorkShiftList',
        component: () => import('@/pages/WorkShiftList.vue'),
      },
      // Claims Routes
      {
        path: 'boi-hoan',
        name: 'ClaimList',
        component: () => import('@/pages/ClaimList.vue'),
      },
      {
        path: 'boi-hoan/phe-duyet',
        name: 'ClaimApproval',
        component: () => import('@/pages/ClaimApproval.vue'),
        meta: {requiresAuth: true, requiresRole: ['admin', 'manager']},
      },
      // Recruitment Routes
      {
        path: 'tuyen-dung',
        name: 'VacancyList',
        component: () => import('@/pages/VacancyList.vue'),
      },
      {
        path: 'tuyen-dung/ung-vien',
        name: 'CandidateList',
        component: () => import('@/pages/CandidateList.vue'),
      },
      {
        path: 'tuyen-dung/pipeline',
        name: 'ApplicationPipeline',
        component: () => import('@/pages/ApplicationPipeline.vue'),
        meta: {requiresRole: ['admin', 'manager']},
      },
      {
        path: 'tuyen-dung/candidate-pool',
        name: 'CandidatePool',
        component: () => import('@/pages/CandidatePool.vue'),
        meta: {requiresRole: ['admin', 'manager']},
      },
      // Performance Routes
      {
        path: 'hieu-suat/kpi',
        name: 'KPIList',
        component: () => import('@/pages/KPIList.vue'),
      },
      {
        path: 'hieu-suat/danh-gia',
        name: 'PerformanceReviewList',
        component: () => import('@/pages/PerformanceReviewList.vue'),
      },
      // Time Module Routes
      {
        path: 'timesheet/my-timesheet',
        name: 'TimesheetEmployee',
        component: () => import('@/pages/TimesheetEmployee.vue'),
      },
      {
        path: 'du-an',
        name: 'ProjectList',
        component: () => import('@/pages/ProjectList.vue'),
      },
      {
        path: 'hoat-dong',
        name: 'ActivityList',
        component: () => import('@/pages/ActivityList.vue'),
      },
      {
        path: 'timesheet/phe-duyet',
        name: 'TimesheetApproval',
        component: () => import('@/pages/TimesheetApproval.vue'),
        meta: {requiresAuth: true, requiresRole: ['admin', 'manager']},
      },
      // Admin Module Routes
      {
        path: 'admin/nguoi-dung',
        name: 'UserList',
        component: () => import('@/pages/UserList.vue'),
        meta: {requiresRole: ['admin']},
      },
      {
        path: 'admin/dia-diem',
        name: 'LocationList',
        component: () => import('@/pages/LocationList.vue'),
      },
      {
        path: 'admin/bac-luong',
        name: 'PayGradeList',
        component: () => import('@/pages/PayGradeList.vue'),
      },
      {
        path: 'admin/sites',
        name: 'SitesManagement',
        component: () => import('@/pages/SitesManagement.vue'),
        meta: {requiresRole: ['admin']},
      },
      {
        path: 'admin/audit-logs',
        name: 'AuditLogs',
        component: () => import('@/pages/AuditLogs.vue'),
        meta: {requiresRole: ['admin']},
      },
      {
        path: 'offboarding',
        name: 'OffboardingList',
        component: () => import('@/pages/OffboardingList.vue'),
        meta: {requiresRole: ['admin', 'manager']},
      },
      // Reports Routes
      {
        path: 'bao-cao',
        name: 'ReportList',
        component: () => import('@/pages/ReportList.vue'),
      },
      {
        path: 'bao-cao/tao-moi',
        name: 'ReportBuilder',
        component: () => import('@/pages/ReportBuilder.vue'),
      },
      {
        path: 'bao-cao/:id/chinh-sua',
        name: 'ReportBuilderEdit',
        component: () => import('@/pages/ReportBuilder.vue'),
      },
      {
        path: 'bao-cao/:id/xem',
        name: 'ReportView',
        component: () => import('@/pages/ReportView.vue'),
      },
      {
        path: 'bao-cao/phap-ly',
        name: 'ComplianceReport',
        component: () => import('@/pages/ComplianceReport.vue'),
        meta: {requiresRole: ['admin', 'manager']},
      },
      {
        path: 'consent-hub',
        name: 'ConsentHub',
        component: () => import('@/pages/ConsentHub.vue'),
        meta: {requiresRole: ['admin', 'manager']},
      },
      // Admin Configurations Routes
      {
        path: 'admin/cau-hinh',
        name: 'AdminConfigurations',
        component: () => import('@/pages/AdminConfigurations.vue'),
        meta: {requiresRole: ['admin']},
      },
      // Performance Tracker Routes
      {
        path: 'hieu-suat/theo-doi',
        name: 'PerformanceTrackerList',
        component: () => import('@/pages/PerformanceTrackerList.vue'),
      },
      {
        path: 'hieu-suat/theo-doi/tao-moi',
        name: 'PerformanceTrackerCreate',
        component: () => import('@/pages/PerformanceTrackerForm.vue'),
      },
      {
        path: 'hieu-suat/theo-doi/:id',
        name: 'PerformanceTrackerDetail',
        component: () => import('@/pages/PerformanceTrackerForm.vue'),
      },
      {
        path: 'hieu-suat/theo-doi/:id/chinh-sua',
        name: 'PerformanceTrackerEdit',
        component: () => import('@/pages/PerformanceTrackerForm.vue'),
      },
      // Enhanced Recruitment - Interview Routes
      {
        path: 'tuyen-dung/phong-van',
        name: 'InterviewList',
        component: () => import('@/pages/InterviewList.vue'),
      },
      // Maintenance Module Routes
      {
        path: 'admin/bao-tri',
        name: 'Maintenance',
        component: () => import('@/pages/MaintenancePage.vue'),
        meta: {requiresRole: ['admin']},
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Navigation Guards
router.beforeEach((to, from, next) => {
  const userIsAuthenticated = isAuthenticated();

  if (to.meta.requiresAuth && !userIsAuthenticated) {
    next('/auth/login');
  } else if (to.meta.requiresGuest && userIsAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
