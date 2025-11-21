module.exports = [
  {
    key: 'vietnamworks',
    name: 'VietnamWorks',
    description: 'Nền tảng tuyển dụng phổ biến tại Việt Nam.',
    url_builder: (vacancyId) =>
      `https://jobs.vietnamworks.com/postings/${vacancyId}`,
    supports_salary: true,
  },
  {
    key: 'topcv',
    name: 'TopCV',
    description: 'Cổng thông tin tuyển dụng TopCV.',
    url_builder: (vacancyId) => `https://www.topcv.vn/viec-lam/${vacancyId}`,
    supports_salary: true,
  },
  {
    key: 'linkedin',
    name: 'LinkedIn Jobs',
    description: 'Đăng tin lên LinkedIn dành cho các vị trí senior.',
    url_builder: (vacancyId) =>
      `https://www.linkedin.com/jobs/view/${vacancyId}`,
  },
  {
    key: 'facebook',
    name: 'Facebook Careers',
    description: 'Fanpage tuyển dụng hoặc nhóm Facebook.',
    url_builder: (vacancyId) =>
      `https://facebook.com/jobs/postings/${vacancyId}`,
  },
];
