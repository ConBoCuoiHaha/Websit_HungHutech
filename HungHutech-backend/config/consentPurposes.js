module.exports = [
  {
    key: 'hr_core',
    name: 'Quan ly ho so nhan su va hop dong',
    description:
      'Su dung thong tin ca nhan de tao va cap nhat ho so lao dong, hop dong, quyet dinh va cac tai lieu lien quan den quan he lao dong.',
    required: true,
    legal_basis: 'Dieu 17, 18 Ngh? dinh 13/2023/ND-CP',
    data_types: [
      'Ho ten, ngay sinh, gioi tinh',
      'CCCD/Ho chieu va tai lieu tuy than',
      'Thong tin lien lac va gia dinh',
    ],
    recipients: ['Co quan BHXH', 'Co quan thue', 'Co quan quan ly lao dong khi bat buoc'],
    retention: 'Xuyen suot thoi gian lao dong va toi thieu 10 nam sau khi nghi viec',
  },
  {
    key: 'payroll_tax',
    name: 'Tinh luong, BHXH va bao cao thue',
    description:
      'Xu ly du lieu cham cong, thu nhap va phu thuoc de tinh luong NET, dong BHXH/BHYT/BHTN va lap cac bao cao thue, lao dong bat buoc.',
    required: true,
    legal_basis: 'Bo luat Lao dong 2019, Luat BHXH 2014, Luat Thue TNCN 2007',
    data_types: [
      'Thong tin luong, phu cap, OT',
      'Thong tin nguoi phu thuoc phuc vu giam tru gia canh',
      'So tai khoan ngan hang de chi tra',
    ],
    recipients: [
      'Co quan BHXH',
      'Co quan Thue',
      'To chuc chi tra luong (ngan hang/ke toan)',
    ],
    retention: 'Theo chu ky ke toan va quy dinh luu tru ho so luong toi thieu 10 nam',
  },
  {
    key: 'internal_comms',
    name: 'Thong tin noi bo va truyen thong',
    description:
      'Su dung email, so dien thoai va hinh anh de gui thong bao cong ty, xay dung danh ba noi bo va cac chuong trinh phuc loi.',
    required: false,
    legal_basis: 'Dong y cua nhan vien theo Ngh? dinh 13/2023/ND-CP',
    data_types: ['Email cong viec', 'So dien thoai', 'Anh chan dung'],
    recipients: ['Phong HR', 'Quan ly truc tiep'],
    retention: 'Trong thoi gian con lam viec tai doanh nghiep',
  },
];
