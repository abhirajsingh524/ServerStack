/**
 * Global error handler — registered last in Express.
 * Normalises all errors into a consistent JSON response shape.
 * Never leaks stack traces to clients.
 */
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  // Always log full error server-side with request context
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
    requestId: req.id,
    stack:     err.stack,
    userId:    req.user?._id,
  });

  // ── Already responded ────────────────────────────────────────────────
  if (res.headersSent) return next(err);

  // ── Mongoose Validation ──────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(422).json({ success: false, message: messages });
  }

  // ── Mongoose Duplicate Key ───────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  // ── Mongoose Bad ObjectId ────────────────────────────────────────────
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  // ── JWT Errors ───────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // ── Multer File Upload Errors ────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large. Maximum size is 10MB' });
  }
  if (err.message === 'File type not allowed') {
    return res.status(415).json({ success: false, message: 'File type not allowed' });
  }

  // ── Encryption Errors ────────────────────────────────────────────────
  if (err.message?.includes('ENCRYPTION_KEY')) {
    logger.error('[CRITICAL] Encryption key not configured');
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  // ── Default — never expose internals ────────────────────────────────
  const statusCode = err.statusCode || err.status || 500;
  const message    = statusCode < 500
    ? err.message || 'Request failed'
    : 'Internal Server Error'; // never leak 500 details to client

  return res.status(statusCode).json({
    success:   false,
    message,
    requestId: req.id, // helps client report the issue
  });
};

module.exports = errorHandler;
