const DiaDiem = require('../schemas/diaDiem.model.js');
const NhanVien = require('../schemas/nhanVien.model.js');
const {parseListParams, buildSort, buildSearchQuery} = require('../utils/pagination');

exports.createDiaDiem = async (req, res) => {
  try {
    const diaDiemMoi = new DiaDiem(req.body);
    await diaDiemMoi.save();
    res.status(201).json(diaDiemMoi);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể tạo địa điểm', error: err.message });
  }
};

exports.getAllDiaDiem = async (req, res) => {
  try {
    const {limit, skip, q, sort, page} = parseListParams(req.query);
    const filter = { da_xoa: false, ...buildSearchQuery(q, ['ten', 'ma', 'mo_ta', 'dia_chi']) };
    const [items, total] = await Promise.all([
      DiaDiem.find(filter).sort(buildSort(sort)).skip(skip).limit(limit),
      DiaDiem.countDocuments(filter),
    ]);

    // Count employees for each location
    const itemsWithCount = await Promise.all(
      items.map(async (location) => {
        const employeeCount = await NhanVien.countDocuments({
          'thong_tin_cong_viec.dia_diem_id': location._id,
        });
        const locationObj = location.toObject();
        locationObj.so_nhan_vien = employeeCount;
        return locationObj;
      })
    );

    res.json({ data: itemsWithCount, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};

exports.getDiaDiemById = async (req, res) => {
  try {
    const diaDiem = await DiaDiem.findById(req.params.id);
    if (!diaDiem || diaDiem.da_xoa) {
      return res.status(404).json({ msg: 'Không tìm thấy địa điểm' });
    }
    res.json(diaDiem);
  } catch (err) {
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Không tìm thấy địa điểm' });
    }
    res.status(500).send('Lỗi máy chủ');
  }
};

exports.updateDiaDiem = async (req, res) => {
  try {
    const diaDiem = await DiaDiem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!diaDiem) {
      return res.status(404).json({ msg: 'Không tìm thấy địa điểm' });
    }
    res.json(diaDiem);
  } catch (err) {
    res.status(400).json({ msg: 'Không thể cập nhật', error: err.message });
  }
};

exports.deleteDiaDiem = async (req, res) => {
  try {
    const diaDiem = await DiaDiem.findByIdAndUpdate(
      req.params.id,
      { da_xoa: true },
      { new: true }
    );
    if (!diaDiem) {
      return res.status(404).json({ msg: 'Không tìm thấy địa điểm' });
    }
    res.json({ msg: 'Địa điểm đã được xóa thành công' });
  } catch (err) {
    res.status(500).send('Lỗi máy chủ');
  }
};

