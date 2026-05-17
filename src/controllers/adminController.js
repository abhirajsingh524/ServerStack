const User       = require('../models/User');
const { sendSuccess } = require('../utils/response');
const { auditLog }    = require('../utils/logger');
const cache           = require('../services/cacheService');
const logger          = require('../config/logger');
const { AUDIT_ACTIONS, CACHE_KEYS, CACHE_TTL } = require('../constants');

const getAllUsers = async (req, res, next) => {
  try {
    const cacheKey = CACHE_KEYS.ADMIN_USERS;
    let users = await cache.get(cacheKey);

    if (!users) {
      users = await User.find()
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .lean();
      await cache.set(cacheKey, users, CACHE_TTL.ADMIN_USERS);
    }

    return sendSuccess(res, 200, 'Users retrieved', users);
  } catch (err) {
    next(err);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    // Invalidate caches
    await cache.del(CACHE_KEYS.USER(req.params.id));
    await cache.del(CACHE_KEYS.ADMIN_USERS);

    await auditLog({
      userId:   req.user._id,
      action:   AUDIT_ACTIONS.ACCOUNT_DEACTIVATED,
      metadata: { userId: req.params.id },
      req,
      severity: 'warn',
    });

    logger.warn('[ADMIN] User deactivated', { targetUserId: req.params.id, adminId: req.user._id });
    return sendSuccess(res, 200, 'User deactivated', user);
  } catch (err) {
    next(err);
  }
};

const activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    // Invalidate caches
    await cache.del(CACHE_KEYS.USER(req.params.id));
    await cache.del(CACHE_KEYS.ADMIN_USERS);

    await auditLog({
      userId:   req.user._id,
      action:   AUDIT_ACTIONS.ACCOUNT_ACTIVATED,
      metadata: { userId: req.params.id },
      req,
    });

    logger.info('[ADMIN] User activated', { targetUserId: req.params.id, adminId: req.user._id });
    return sendSuccess(res, 200, 'User activated', user);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, deactivateUser, activateUser };
