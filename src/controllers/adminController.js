const User = require('../models/User');
const { sendSuccess } = require('../utils/response');

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password -refreshToken').sort({ createdAt: -1 });
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

    return sendSuccess(res, 200, 'User activated', user);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, deactivateUser, activateUser };
