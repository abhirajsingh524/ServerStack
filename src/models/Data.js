const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    // AES-256-GCM encrypted payload for sensitive JSON data
    encryptedData: {
      type: String,
      default: null,
      select: false, // never returned by default — must be explicitly requested
    },
    // File attachment metadata
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
      required: [true, 'Owner is required'],
    },
    accessLevel: {
      type: String,
      enum: {
        values: ['private', 'shared', 'public'],
        message: 'accessLevel must be private, shared, or public',
      },
      default: 'private',
    },
    tags: {
      type: [{ type: String, trim: true, maxlength: 50 }],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'Maximum 20 tags allowed',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Primary query pattern: owner's records sorted by date
dataSchema.index({ ownerId: 1, createdAt: -1 });

// Access level filtering (for shared/public queries)
dataSchema.index({ accessLevel: 1, createdAt: -1 });

// Tag-based filtering
dataSchema.index({ tags: 1 });

// Full-text search on title and description
dataSchema.index({ title: 'text', description: 'text' });

// Compound: owner + access level (most common researcher query)
dataSchema.index({ ownerId: 1, accessLevel: 1 });

module.exports = mongoose.model('Data', dataSchema);
