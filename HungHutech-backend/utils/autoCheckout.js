const ChamCong = require('../schemas/chamCong.model');

// Default end of day time (17:30)
const DEFAULT_END_HOUR = 17;
const DEFAULT_END_MIN = 30;

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(DEFAULT_END_HOUR, DEFAULT_END_MIN, 0, 0);
  return d;
}

async function autoCheckoutOverdueRecords() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0,0,0,0);

  // 1) Auto close previous days
  const previous = await ChamCong.find({ thoi_gian_ra: { $exists: false }, ngay: { $lt: today } });
  for (const r of previous) {
    const autoTime = endOfDay(r.ngay);
    r.thoi_gian_ra = autoTime;
    r.ghi_chu = (r.ghi_chu || '') + ' | autoCheckout:true';
    await r.save();
  }

  // 2) Auto close today if past end time
  const eod = endOfDay(today);
  if (now > eod) {
    const todays = await ChamCong.find({ thoi_gian_ra: { $exists: false }, ngay: today });
    for (const r of todays) {
      r.thoi_gian_ra = eod;
      r.ghi_chu = (r.ghi_chu || '') + ' | autoCheckout:true';
      await r.save();
    }
  }
}

module.exports = { autoCheckoutOverdueRecords };

