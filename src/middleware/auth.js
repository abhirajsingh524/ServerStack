const { verifyAccessToken } = require('../utils/tokenUtils');
const { sendError } = require('../utils/response');
const User = require('../models/User');

/**
 * Verify JWT access token and attach the full user document to req.user.
 * Rejects deactivated accounts even with a valid token.
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Access token required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) return sendError(res, 401, 'Access token required');

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) {
      return sendError(res, 401, 'User no longer exists');
    }
    if (!user.isActive) {
      return sendError(res, 403, 'Account has been deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Access token expired — please refresh');
    }
    return sendError(res, 401, 'Invalid access token');
  }
};

/**
 * RBAC middleware factory.
 * Usage: checkRole('admin') or checkRole('admin', 'researcher')
 *
 * @param {...string} roles - Allowed roles
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, `Forbidden: requires role [${roles.join(' | ')}]`);
    }
    next();
  };
};

module.exports = { verifyToken, checkRole };
