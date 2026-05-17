const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2,   'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'researcher'],
        message: 'Role must be admin or researcher',
      },
      default: 'researcher',
    },
    // Stores SHA-256 hash of the refresh token — never the raw token
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        // Never expose sensitive fields in JSON output
        delete ret.password;
        delete ret.refreshToken;
        return ret;
      },
    },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Note: email unique index is already created by `unique: true` in the schema.
// Only add additional indexes here to avoid the duplicate index warning.
userSchema.index({ role: 1 });        // role-based queries
userSchema.index({ isActive: 1 });    // active user filtering

// ── Hooks ────────────────────────────────────────────────────────────────────
// Mongoose 9: async pre-save hooks must NOT call next() — return the Promise instead
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ── Methods ──────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
