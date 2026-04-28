const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // AES-encrypted payload for JSON data
    encryptedData: {
      type: String,
      default: null,
    },
    // File path for uploaded files
    fileUrl: {
      type: String,
      default: null,
    },
    fileOriginalName: {
      type: String,
      default: null,
    },
    fileMimeType: {
      type: String,
      default: null,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accessLevel: {
      type: String,
      enum: ['private', 'shared', 'public'],
      default: 'private',
    },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// Index for fast owner-based queries
dataSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('Data', dataSchema);
