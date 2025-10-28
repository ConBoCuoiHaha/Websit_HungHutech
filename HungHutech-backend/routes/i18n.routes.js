const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Load translations from JSON file
router.get('/core/i18n/messages', (_req, res) => {
  try {
    const filePath = path.join(__dirname, '../data/vi_VN.json');

    // Check if file exists, if not use default translations
    if (fs.existsSync(filePath)) {
      const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return res.json(translations);
    }

    // Fallback to default translations
    const defaultMessages = {
      'general.save': { source: 'Save', target: 'Lưu', description: 'Save action label' },
      'general.cancel': { source: 'Cancel', target: 'Hủy', description: 'Cancel action label' },
      'general.edit': { source: 'Edit', target: 'Sửa', description: 'Edit action label' },
      'general.delete': { source: 'Delete', target: 'Xóa', description: 'Delete action label' },
      'general.view': { source: 'View', target: 'Xem', description: 'View action label' },
      'general.add': { source: 'Add', target: 'Thêm', description: 'Add action label' },
      'general.search': { source: 'Search', target: 'Tìm kiếm', description: 'Search action label' },
      'general.reset': { source: 'Reset', target: 'Đặt lại', description: 'Reset action label' },
      'general.employee_name': { source: 'Employee Name', target: 'Tên nhân viên', description: 'Employee name label' },
      'general.employee_id': { source: 'Employee Id', target: 'Mã nhân viên', description: 'Employee ID label' },
      'pim.employee_information': { source: 'Employee Information', target: 'Thông tin Nhân viên', description: 'Employee information title' },
    };

    res.json(defaultMessages);
  } catch (error) {
    console.error('Error loading translations:', error);
    res.status(500).json({ error: 'Không thể tải bản dịch' });
  }
});

module.exports = router;

