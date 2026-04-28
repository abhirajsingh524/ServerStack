const Log = require('../models/Log');
const { sendSuccess } = require('../utils/response');

const getLogs = async (req, res, next) => {
  try {
    const { action, userId, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      Log.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Log.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Logs retrieved', {
      logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLogs };
