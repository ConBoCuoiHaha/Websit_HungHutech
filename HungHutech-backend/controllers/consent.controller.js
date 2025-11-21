const Consent = require('../schemas/consent.model');
const NhanVien = require('../schemas/nhanVien.model');
const consentPurposes = require('../config/consentPurposes');
const {parseListParams} = require('../utils/pagination');

const normalizedPurposes = consentPurposes.map((purpose) => ({
  key: purpose.key,
  name: purpose.name,
  description: purpose.description || '',
  required: Boolean(purpose.required),
  legal_basis: purpose.legal_basis || '',
  data_types: purpose.data_types || [],
  recipients: purpose.recipients || purpose.shared_with || [],
  retention: purpose.retention || '',
}));

function mergeRecord(purpose, record) {
  return {
    ...purpose,
    status: record?.status || 'Pending',
    granted_at: record?.granted_at || null,
    withdrawn_at: record?.withdrawn_at || null,
    note: record?.note || '',
    last_history: record?.history?.length
      ? record.history[record.history.length - 1]
      : null,
  };
}

exports.getPurposes = (req, res) => {
  res.json({ data: normalizedPurposes });
};

exports.getMyConsents = async (req, res) => {
  try {
    const records = await Consent.find({ user_id: req.user.id }).lean();
    const merged = normalizedPurposes.map((purpose) => {
      const record = records.find((item) => item.purpose === purpose.key);
      return mergeRecord(purpose, record);
    });
    const pendingRequired = merged.some(
      (item) => item.required && item.status !== 'Accepted',
    );
    res.json({ data: merged, pending_required: pendingRequired });
  } catch (err) {
    console.error('getMyConsents error', err);
    res.status(500).json({ msg: 'Khong the tai trang thai consent', error: err.message });
  }
};

exports.saveConsents = async (req, res) => {
  try {
    const { consents } = req.body || {};
    if (!Array.isArray(consents) || consents.length === 0) {
      return res.status(400).json({ msg: 'Danh sach consent khong hop le' });
    }

    const purposeMap = new Map(normalizedPurposes.map((p) => [p.key, p]));
    const now = new Date();

    for (const entry of consents) {
      if (!entry || !purposeMap.has(entry.purpose)) continue;
      const purpose = purposeMap.get(entry.purpose);
      const accepted = Boolean(entry.accepted);
      if (purpose.required && !accepted) {
        return res.status(400).json({
          msg: `Muc dich ${purpose.name} la bat buoc, khong the tu choi`,
        });
      }

      const update = {
        $set: {
          user_id: req.user.id,
          nhan_vien_id: req.user.nhan_vien_id || null,
          purpose: entry.purpose,
          status: accepted ? 'Accepted' : 'Withdrawn',
          note: entry.note || '',
        },
        $push: {
          history: {
            status: accepted ? 'Accepted' : 'Withdrawn',
            acted_at: now,
            actor_id: req.user.id,
            note: entry.note || '',
          },
        },
        $unset: {},
      };

      if (accepted) {
        update.$set.granted_at = now;
        update.$unset.withdrawn_at = '';
      } else {
        update.$set.withdrawn_at = now;
        update.$unset.granted_at = '';
      }

      await Consent.findOneAndUpdate(
        { user_id: req.user.id, purpose: entry.purpose },
        update,
        { upsert: true, setDefaultsOnInsert: true },
      );
    }

    const records = await Consent.find({ user_id: req.user.id }).lean();
    const merged = normalizedPurposes.map((purpose) => {
      const record = records.find((item) => item.purpose === purpose.key);
      return mergeRecord(purpose, record);
    });
    const pendingRequired = merged.some(
      (item) => item.required && item.status !== 'Accepted',
    );

    res.json({ data: merged, pending_required: pendingRequired });
  } catch (err) {
    console.error('saveConsents error', err);
    res.status(500).json({ msg: 'Khong the cap nhat consent', error: err.message });
  }
};

exports.listAllConsents = async (req, res) => {
  if (!(req.user && ['admin', 'manager'].includes(req.user.role))) {
    return res.status(403).json({msg: 'Khong co quyen xem consent'});
  }
  try {
    const {page, limit, skip, q} = parseListParams(req.query);
    const filter = {da_xoa: {$ne: true}};
    if (req.query.phong_ban_id) {
      filter['thong_tin_cong_viec.phong_ban_id'] = req.query.phong_ban_id;
    }
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        {ma_nhan_vien: regex},
        {ho_dem: regex},
        {ten: regex},
      ];
    }
    const [employees, total] = await Promise.all([
      NhanVien.find(filter)
        .select('ma_nhan_vien ho_dem ten thong_tin_cong_viec.phong_ban_id')
        .populate('thong_tin_cong_viec.phong_ban_id', 'ten')
        .skip(skip)
        .limit(limit)
        .lean(),
      NhanVien.countDocuments(filter),
    ]);
    const ids = employees.map((emp) => emp._id);
    const consentDocs = await Consent.find({
      nhan_vien_id: {$in: ids},
    }).lean();
    const consentMap = new Map(
      consentDocs.map((doc) => [`${doc.nhan_vien_id}:${doc.purpose}`, doc]),
    );
    const data = employees.map((emp) => ({
      nhan_vien: emp,
      phong_ban: emp.thong_tin_cong_viec?.phong_ban_id || null,
      purposes: normalizedPurposes.map((purpose) => {
        const key = `${emp._id}:${purpose.key}`;
        const record = consentMap.get(key);
        return mergeRecord(purpose, record);
      }),
    }));
    res.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('listAllConsents error', err);
    res.status(500).json({msg: 'Khong the tai consent hub', error: err.message});
  }
};

exports.getConsentOverview = async (req, res) => {
  if (!(req.user && ['admin', 'manager'].includes(req.user.role))) {
    return res.status(403).json({msg: 'Khong co quyen xem consent'});
  }
  try {
    const totalEmployees = await NhanVien.countDocuments({da_xoa: {$ne: true}});
    const stats = [];
    for (const purpose of normalizedPurposes) {
      const [accepted, withdrawn] = await Promise.all([
        Consent.countDocuments({purpose: purpose.key, status: 'Accepted'}),
        Consent.countDocuments({purpose: purpose.key, status: 'Withdrawn'}),
      ]);
      const pending = Math.max(totalEmployees - (accepted + withdrawn), 0);
      stats.push({
        key: purpose.key,
        name: purpose.name,
        required: purpose.required,
        accepted,
        withdrawn,
        pending,
      });
    }
    res.json({data: stats, total_employees: totalEmployees});
  } catch (err) {
    console.error('getConsentOverview error', err);
    res.status(500).json({msg: 'Khong the thong ke consent', error: err.message});
  }
};
