/**
 * Auth Service — registration, login, token rotation, logout.
 * Integrates: audit logging, Redis cache invalidation, hashed refresh tokens.
 */
const crypto = require('crypto');
const User   = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const { auditLog } = require('../utils/logger');
const cache  = require('./cacheService');
const logger = require('../config/logger');
const { AUDIT_ACTIONS, CACHE_KEYS, CACHE_TTL } = require('../constants');

/**
 * Hash a refresh token before storing in DB.
 * Prevents token theft if the database is compromised.
 */
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// ── Register ──────────────────────────────────────────────────────────────────
const register = async ({ name, email, password, role }, req) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, email, password, role });

  await auditLog({
    userId:   user._id,
    action:   AUDIT_ACTIONS.REGISTER,
    metadata: { email },
    req,
  });

  logger.info('[AUTH] New user registered', { userId: user._id, role: user.role });

  return {
    id:    user._id,
    name:  user.name,
    email: user.email,
    role:  user.role,
  };
};

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async ({ email, password }, req) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');

  if (!user || !user.isActive) {
    await auditLog({
      action:   AUDIT_ACTIONS.LOGIN_FAILED,
      metadata: { email, reason: 'User not found or inactive' },
      req,
      severity: 'warn',
    });
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await auditLog({
      userId:   user._id,
      action:   AUDIT_ACTIONS.LOGIN_FAILED,
      metadata: { email, reason: 'Wrong password' },
      req,
      severity: 'warn',
    });
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const payload      = { id: user._id, role: user.role };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store SHA-256 hash of refresh token — raw token never persisted
  user.refreshToken = hashToken(refreshToken);
  user.lastLoginAt  = new Date();
  await user.save({ validateBeforeSave: false });

  // Cache user profile
  const userProfile = { id: user._id, name: user.name, email: user.email, role: user.role };
  await cache.set(CACHE_KEYS.USER(user._id), userProfile, CACHE_TTL.USER_PROFILE);

  await auditLog({
    userId:   user._id,
    action:   AUDIT_ACTIONS.LOGIN_SUCCESS,
    metadata: { email },
    req,
  });

  logger.info('[AUTH] Login successful', { userId: user._id });

  return { accessToken, refreshToken, user: userProfile };
};

// ── Refresh Tokens ────────────────────────────────────────────────────────────
const refreshTokens = async (token, req) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findById(decoded.id).select('+refreshToken');

  // Compare hash of incoming token against stored hash (rotation + reuse detection)
  if (!user || user.refreshToken !== hashToken(token)) {
    await auditLog({
      userId:   decoded.id,
      action:   AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
      metadata: { reason: 'Refresh token reuse detected' },
      req,
      severity: 'warn',
    });
    const err = new Error('Refresh token reuse detected or invalid');
    err.statusCode = 401;
    throw err;
  }

  const payload         = { id: user._id, role: user.role };
  const newAccessToken  = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  // Rotate: store new hash, invalidate old
  user.refreshToken = hashToken(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  await auditLog({
    userId:   user._id,
    action:   AUDIT_ACTIONS.TOKEN_REFRESH,
    metadata: {},
    req,
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = async (userId, req) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });

  // Evict user profile from cache
  await cache.del(CACHE_KEYS.USER(userId));

  await auditLog({
    userId,
    action:   AUDIT_ACTIONS.LOGOUT,
    metadata: {},
    req,
  });

  logger.info('[AUTH] User logged out', { userId });
};

module.exports = { register, login, refreshTokens, logout };
