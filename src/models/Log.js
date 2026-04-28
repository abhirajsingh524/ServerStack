const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'REGISTER',
        'DATA_CREATE',
        'DATA_READ',
        'DATA_UPDATE',
        'DATA_DELETE',
        'UNAUTHORIZED_ACCESS',
      ],
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
    },
  },
  { timestamps: true }
);

// Index for fast queries
logSchema.index({ userId: 1, createdAt: -1 });
logSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);
