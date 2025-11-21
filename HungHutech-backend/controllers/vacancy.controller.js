const Vacancy = require('../schemas/vacancy.model');
const {parseListParams, buildSort, buildSearchQuery} = require('../utils/pagination');
const jobBoardPublisher = require('../services/jobBoardPublisher');

exports.createVacancy = async (req, res) => {
  try {
    const doc = await Vacancy.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({msg: 'Khong the tao vi tri tuyen dung', error: err.message});
  }
};

exports.getAllVacancies = async (req, res) => {
  try {
    const {limit, skip, q, sort, page} = parseListParams(req.query);
    const filter = {da_xoa: false, ...buildSearchQuery(q, ['tieu_de', 'mo_ta'])};
    const [items, total] = await Promise.all([
      Vacancy.find(filter)
        .populate('hiring_manager_id', 'ho_dem ten')
        .populate('dia_diem_id', 'ten')
        .sort(buildSort(sort))
        .skip(skip)
        .limit(limit),
      Vacancy.countDocuments(filter),
    ]);
    res.json({data: items, pagination: {total, page, limit, totalPages: Math.ceil(total / limit)}});
  } catch (err) {
    res.status(500).json({msg: 'Loi may chu'});
  }
};

exports.getVacancyById = async (req, res) => {
  try {
    const item = await Vacancy.findById(req.params.id)
      .populate('hiring_manager_id', 'ho_dem ten')
      .populate('dia_diem_id', 'ten');
    if (!item || item.da_xoa) return res.status(404).json({msg: 'Khong tim thay vi tri'});
    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({msg: 'Khong tim thay vi tri'});
    res.status(500).json({msg: 'Loi may chu'});
  }
};

exports.updateVacancy = async (req, res) => {
  try {
    const item = await Vacancy.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({msg: 'Khong tim thay vi tri'});
    res.json(item);
  } catch (err) {
    res.status(400).json({msg: 'Khong the cap nhat', error: err.message});
  }
};

exports.deleteVacancy = async (req, res) => {
  try {
    const item = await Vacancy.findByIdAndUpdate(req.params.id, {da_xoa: true}, {new: true});
    if (!item) return res.status(404).json({msg: 'Khong tim thay vi tri'});
    res.json({msg: 'Vi tri da duoc xoa thanh cong'});
  } catch (err) {
    res.status(500).json({msg: 'Loi may chu'});
  }
};

exports.getJobBoards = (_req, res) => {
  res.json({data: jobBoardPublisher.getChannels()});
};

exports.publishToChannels = async (req, res) => {
  try {
    const {channels} = req.body;
    if (!Array.isArray(channels) || !channels.length) {
      return res.status(400).json({msg: 'Vui long chon kenh dang tin'});
    }
    const vacancy = await Vacancy.findById(req.params.id);
    if (!vacancy || vacancy.da_xoa) {
      return res.status(404).json({msg: 'Khong tim thay vi tri'});
    }
    const existingMap = new Map(
      (vacancy.channels || []).map((channel) => [channel.channel_key, channel]),
    );
    const results = [];
    for (const key of channels) {
      try {
        const result = await jobBoardPublisher.publish(key, vacancy);
        const channelConfig = jobBoardPublisher.getChannels().find(
          (item) => item.key === key,
        );
        const entry = {
          channel_key: key,
          channel_name: channelConfig?.name || key,
          trang_thai: 'Thanh cong',
          posted_url: result.url,
          reference_code: result.reference,
          posted_at: new Date(),
        };
        existingMap.set(key, entry);
        results.push({channel: key, success: true, url: result.url});
      } catch (error) {
        const config = jobBoardPublisher.getChannels().find(
          (item) => item.key === key,
        );
        existingMap.set(key, {
          channel_key: key,
          channel_name: config?.name || key,
          trang_thai: 'That bai',
          posted_at: new Date(),
          error_message: error.message,
        });
        results.push({channel: key, success: false, error: error.message});
      }
    }
    vacancy.channels = Array.from(existingMap.values());
    await vacancy.save();
    res.json({msg: 'Da dang tin len cac kenh', channels: vacancy.channels, results});
  } catch (err) {
    console.error('publishToChannels error', err);
    res.status(500).json({msg: 'Khong the dang tin da kenh', error: err.message});
  }
};
