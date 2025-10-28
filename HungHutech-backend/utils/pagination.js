function parseListParams(query) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
  const skip = (page - 1) * limit;
  const q = (query.q || '').toString().trim();
  const sort = (query.sort || '').toString().trim();
  return {page, limit, skip, q, sort};
}

function buildSort(sortStr, fallback = '-ngay_tao') {
  if (!sortStr) return fallback;
  // e.g. 'ten:asc,ngay_tao:desc'
  const fields = sortStr.split(',').map((s) => s.trim()).filter(Boolean);
  if (fields.length === 0) return fallback;
  const mapped = fields.map((f) => {
    const [k, dir] = f.split(':');
    return (dir && dir.toLowerCase() === 'asc') ? k : `-${k}`;
  });
  return mapped.join(' ');
}

function buildSearchQuery(q, fields) {
  if (!q) return {};
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return {$or: fields.map((f) => ({[f]: regex}))};
}

module.exports = { parseListParams, buildSort, buildSearchQuery };

