const { verifyAccessToken } = require('../utils/tokenUtils');
const { sendError } = require('../utils/response');
const User = require('../models/User');

/**
 * Verify JWT access token and attach user to request
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Access token required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user || !user.isActive) {
      return sendError(res, 401, 'User not found or deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Access token expired');
    }
    return sendError(res, 401, 'Invalid access token');
  }
};

/**
 * RBAC role check middleware factory
 * @param {...string} roles - allowed roles
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 403, 'Forbidden: insufficient permissions');
    }
    next();
  };
};

module.exports = { verifyToken, checkRole };
