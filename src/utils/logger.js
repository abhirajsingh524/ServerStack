/**
 * CogniVault Audit Logger
 * Writes structured audit entries to MongoDB AND Winston.
 * Never throws — log failures must not crash the application.
 */
const Log    = require('../models/Log');
const logger = require('../config/logger');
const { AUDIT_ACTIONS } = require('../constants');

// ── Allowed metadata keys (whitelist prevents injection) ──────────────────────
const SAFE_METADATA_KEYS = [
  'email', 'dataId', 'title', 'reason',
  'fields', 'userId', 'filename', 'action',
  'resourceType', 'resourceId', 'changes',
];

const sanitizeMetadata = (metadata = {}) => {
  const safe = {};
  SAFE_METADATA_KEYS.forEach(key => {
    if (metadata[key] !== undefined) {
      const val = metadata[key];
      // Coerce to string, truncate to 500 chars
      safe[key] = String(typeof val === 'object' ? JSON.stringify(val) : val).slice(0, 500);
    }
  });
  return safe;
};

// ── Extract real client IP (proxy-aware) ──────────────────────────────────────
const getClientIp = (req) => {
  if (!req) return null;
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || null;
};

// ── Validate action is a known enum value ─────────────────────────────────────
const isValidAction = (action) => Object.values(AUDIT_ACTIONS).includes(action);

/**
 * Write an audit log entry to MongoDB + Winston.
 *
 * @param {Object} options
 * @param {string|null}  options.userId   - MongoDB ObjectId of acting user
 * @param {string}       options.action   - AUDIT_ACTIONS enum value
 * @param {Object}       options.metadata - Additional context (sanitized)
 * @param {Object|null}  options.req      - Express request (for IP/UA)
 * @param {string}       options.severity - 'info' | 'warn' | 'error' (default: 'info')
 */
const auditLog = async ({
  userId   = null,
  action,
  metadata = {},
  req      = null,
  severity = 'info',
} = {}) => {
  if (!action) return;

  // Warn if unknown action used (don't block, but flag it)
  if (!isValidAction(action)) {
    logger.warn(`[AUDIT] Unknown action: ${action}`);
  }

  const sanitized  = sanitizeMetadata(metadata);
  const ipAddress  = getClientIp(req);
  const userAgent  = req?.headers?.['user-agent'] || null;
  const requestId  = req?.id || null;

  // ── Winston structured log ────────────────────────────────────────────────
  logger[severity](`[AUDIT] ${action}`, {
    userId:    userId?.toString() || null,
    action,
    metadata:  sanitized,
    ipAddress,
    requestId,
  });

  // ── MongoDB audit record ──────────────────────────────────────────────────
  try {
    await Log.create({
      userId,
      action,
      metadata:  sanitized,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    // Log to Winston but never throw — audit failures must not crash the app
    logger.error('[AUDIT DB ERROR]', { message: err.message, action, userId });
  }
};

module.exports = { auditLog };
