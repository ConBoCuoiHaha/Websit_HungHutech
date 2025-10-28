const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hung HutechNode.js Backend API',
      version: '1.0.0',
      description: 'Hệ thống quản lý nhân sự Hung Hutech - API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@abc.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.orangehrm.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token (không cần thêm "Bearer" ở đầu)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            msg: {
              type: 'string',
              description: 'Thông báo lỗi',
            },
            error: {
              type: 'string',
              description: 'Chi tiết lỗi',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {},
            },
            page: {
              type: 'integer',
              description: 'Trang hiện tại',
            },
            limit: {
              type: 'integer',
              description: 'Số lượng items mỗi trang',
            },
            total: {
              type: 'integer',
              description: 'Tổng số items',
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Xác thực và phân quyền' },
      { name: 'Nhân viên', description: 'Quản lý nhân viên' },
      { name: 'Chức danh', description: 'Quản lý chức danh' },
      { name: 'Phòng ban', description: 'Quản lý phòng ban' },
      { name: 'Địa điểm', description: 'Quản lý địa điểm làm việc' },
      { name: 'Trạng thái lao động', description: 'Quản lý trạng thái lao động' },
      { name: 'Nghỉ phép', description: 'Quản lý nghỉ phép và yêu cầu nghỉ' },
      { name: 'Chấm công', description: 'Quản lý chấm công' },
      { name: 'Dự án', description: 'Quản lý dự án và hoạt động' },
      { name: 'Timesheet', description: 'Quản lý bảng chấm công' },
      { name: 'Tuyển dụng', description: 'Quản lý tuyển dụng và ứng viên' },
      { name: 'Hiệu suất', description: 'Đánh giá hiệu suất và KPI' },
      { name: 'Claims', description: 'Yêu cầu bồi hoàn chi phí' },
      { name: 'Buzz', description: 'Mạng xã hội nội bộ' },
      { name: 'Dashboard', description: 'Trang tổng quan' },
      { name: 'Directory', description: 'Danh bạ nhân viên' },
      { name: 'Upload', description: 'Upload file' },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
  ],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;

