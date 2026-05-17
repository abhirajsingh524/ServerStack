const Log    = require('../models/Log');
const { sendSuccess } = require('../utils/response');
const cache  = require('../services/cacheService');
const { CACHE_KEYS, CACHE_TTL } = require('../constants');

const getLogs = async (req, res, next) => {
  try {
    const { action, userId, severity, limit = 50, page = 1 } = req.query;

    const filter = {};
    if (action)   filter.action   = action;
    if (userId)   filter.userId   = userId;
    if (severity) filter.severity = severity;

    const cacheKey = CACHE_KEYS.LOGS(page, limit, action);
    let result = await cache.get(cacheKey);

    if (!result) {
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [logs, total] = await Promise.all([
        Log.find(filter)
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Log.countDocuments(filter),
      ]);

      result = {
        logs,
        pagination: {
          total,
          page:  parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      };

      await cache.set(cacheKey, result, CACHE_TTL.LOGS);
    }

    return sendSuccess(res, 200, 'Logs retrieved', result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getLogs };
