const mongoose = require('mongoose');
const { AUDIT_ACTIONS, LOG_RETENTION } = require('../constants');

const logSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: {
        values: Object.values(AUDIT_ACTIONS),
        message: 'Invalid audit action: {VALUE}',
      },
      index: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warn', 'error'],
      default: 'info',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
      maxlength: 500,
    },
    // Request correlation ID for distributed tracing
    requestId: {
      type: String,
      default: null,
    },
    // HTTP context
    httpMethod: {
      type: String,
      default: null,
    },
    endpoint: {
      type: String,
      default: null,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    // Response time in ms
    durationMs: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    // Prevent accidental modification of audit records
    strict: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
logSchema.index({ userId: 1, createdAt: -1 });
logSchema.index({ action: 1, createdAt: -1 });
logSchema.index({ severity: 1, createdAt: -1 });
logSchema.index({ ipAddress: 1, createdAt: -1 });

// ── TTL Index — auto-delete logs after 90 days ────────────────────────────────
logSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: LOG_RETENTION.TTL_SECONDS, name: 'log_ttl' }
);

module.exports = mongoose.model('Log', logSchema);
