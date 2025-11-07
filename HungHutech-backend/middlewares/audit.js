const AuditLog = require('../schemas/auditLog.model');

async function audit(action, entity, entity_id, data = {}, req = null) {
  try {
    await AuditLog.create({
      user_id: req?.user?.id || null,
      action,
      entity,
      entity_id: String(entity_id),
      data,
      ip: req?.ip || null,
      ua: req?.headers['user-agent'] || null,
    });
  } catch (err) {
    // fail silently
  }
}

module.exports = { audit };

