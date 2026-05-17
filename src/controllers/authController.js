const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body, req);
    return sendSuccess(res, 201, 'User registered successfully', user);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body, req);
    return sendSuccess(res, 200, 'Login successful', result);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken, req);
    return sendSuccess(res, 200, 'Tokens refreshed', tokens);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user._id, req);
    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  return sendSuccess(res, 200, 'Current user', {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
};

module.exports = { register, login, refresh, logout, me };
