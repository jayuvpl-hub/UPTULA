const { query } = require('../db');

/**
 * Append an entry to audit_logs (spec section 17). Best-effort: never throws into
 * the request path. Pull the client IP off the request when available.
 */
async function logAudit({ userId = null, actorRole = null, action, entity = null, entityId = null, ip = null, meta = null }) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, actor_role, action, entity, entity_id, ip, meta)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId != null ? Number(userId) : null,
        actorRole,
        String(action).slice(0, 100),
        entity,
        entityId != null ? Number(entityId) : null,
        ip ? String(ip).slice(0, 64) : null,
        meta ? JSON.stringify(meta) : null,
      ]
    );
  } catch (err) {
    console.warn('audit log failed:', err.message);
  }
}

/** Convenience wrapper that derives actor + ip from an Express request. */
function auditFromReq(req, action, { entity = null, entityId = null, meta = null } = {}) {
  return logAudit({
    userId: req.user?.id || null,
    actorRole: req.user?.role || null,
    action,
    entity,
    entityId,
    ip: req.headers['x-forwarded-for'] || req.ip || null,
    meta,
  });
}

module.exports = { logAudit, auditFromReq };
