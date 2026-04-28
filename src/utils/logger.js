const Log = require('../models/Log');

/**
 * Write an audit log entry to the database
 */
const auditLog = async ({ userId = null, action, metadata = {}, req = null }) => {
  try {
    await Log.create({
      userId,
      action,
      metadata,
      ipAddress: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null,
      userAgent: req ? req.headers['user-agent'] : null,
    });
  } catch (err) {
    // Log failures should never crash the app
    console.error('Audit log error:', err.message);
  }
};

module.exports = { auditLog };
