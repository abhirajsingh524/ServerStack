const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const { auditLog } = require('../utils/logger');

const register = async ({ name, email, password, role }, req) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, email, password, role });

  await auditLog({ userId: user._id, action: 'REGISTER', metadata: { email }, req });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

const login = async ({ email, password }, req) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');

  if (!user || !user.isActive) {
    await auditLog({ action: 'LOGIN_FAILED', metadata: { email, reason: 'User not found' }, req });
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await auditLog({ userId: user._id, action: 'LOGIN_FAILED', metadata: { email, reason: 'Wrong password' }, req });
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const payload = { id: user._id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Persist refresh token (hashed storage is optional; storing as-is for simplicity)
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  await auditLog({ userId: user._id, action: 'LOGIN_SUCCESS', metadata: { email }, req });

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

const refreshTokens = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    const err = new Error('Refresh token reuse detected');
    err.statusCode = 401;
    throw err;
  }

  const payload = { id: user._id, role: user.role };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

module.exports = { register, login, refreshTokens, logout };
