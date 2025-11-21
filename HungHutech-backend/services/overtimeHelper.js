const NgayLe = require('../schemas/ngayLe.model');

const NIGHT_START = 22;
const NIGHT_END = 6;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const combineTimeWithDate = (baseDate, hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const dt = new Date(baseDate);
  dt.setHours(h || 0, m || 0, 0, 0);
  return dt;
};

const sameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const isNightTime = (date) => {
  const hours = date.getHours() + date.getMinutes() / 60;
  return hours >= NIGHT_START || hours < NIGHT_END;
};

const detectHoliday = async (dateObj) => {
  const start = startOfDay(dateObj);
  const end = endOfDay(dateObj);
  const docs = await NgayLe.find({
    $or: [
      {lap_lai_hang_nam: false, ngay: {$gte: start, $lte: end}},
      {lap_lai_hang_nam: true},
    ],
  }).lean();
  return docs.some((holiday) => {
    if (holiday.lap_lai_hang_nam) {
      const origin = new Date(holiday.ngay);
      return (
        origin.getMonth() === dateObj.getMonth() &&
        origin.getDate() === dateObj.getDate()
      );
    }
    return sameDay(holiday.ngay, dateObj);
  });
};

const classifyOvertimeType = async (dateObj, startTime, endTime) => {
  const isHoliday = await detectHoliday(dateObj);
  const isWeekend = [0, 6].includes(dateObj.getDay());
  const baseType = isHoliday ? 'holiday' : isWeekend ? 'weekend' : 'weekday';
  const night = isNightTime(startTime) || isNightTime(endTime);
  let type = baseType;
  if (night) {
    type = `${baseType}_night`;
  }
  let multiplier = 1.5;
  if (baseType === 'weekend') multiplier = 2;
  if (baseType === 'holiday') multiplier = 3;
  if (night) multiplier += 0.3;
  return {type, multiplier};
};

module.exports = {
  startOfDay,
  endOfDay,
  combineTimeWithDate,
  classifyOvertimeType,
};
