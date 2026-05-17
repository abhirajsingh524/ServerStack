const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRY  = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const ALGORITHM = 'HS256';

const generateAccessToken = (payload) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: ALGORITHM,
  });
};

const generateRefreshToken = (payload) => {
  if (!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET is not set');
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: ALGORITHM,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: [ALGORITHM] });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, { algorithms: [ALGORITHM] });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
