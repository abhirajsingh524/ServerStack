/**
 * CogniVault Rate Limiting Configuration
 * Modular rate limiters per route type.
 * Uses ipKeyGenerator helper to properly handle IPv4 + IPv6.
 */
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { RATE_LIMITS } = require('../../constants');
const logger = require('../logger');

// ── Store factory ─────────────────────────────────────────────────────────────
const buildStore = () => {
  try {
    const { isRedisReady, getRedisClient } = require('../redis');
    if (isRedisReady()) {
      const { RedisStore } = require('rate-limit-redis');
      return new RedisStore({
        sendCommand: (...args) => getRedisClient().call(...args),
        prefix: 'rl:',
      });
    }
  } catch {
    // Redis not available — use default memory store
  }
  return undefined;
};

// ── Per-user key generator (falls back to IP via ipKeyGenerator) ──────────────
const userOrIpKey = (req) => {
  if (req.user?._id) return `user:${req.user._id}`;
  return ipKeyGenerator(req); // properly handles IPv4-mapped IPv6
};

// ── Standard rate limit exceeded response ─────────────────────────────────────
const rateLimitHandler = (req, res) => {
  logger.warn('[RATE LIMIT] Exceeded', {
    ip:       req.ip,
    userId:   req.user?._id,
    endpoint: req.originalUrl,
    method:   req.method,
  });
  res.status(429).json({
    success:    false,
    message:    'Too many requests — please slow down and try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// ── Global limiter — all routes ───────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs:        RATE_LIMITS.GLOBAL_WINDOW_MS,
  max:             RATE_LIMITS.GLOBAL_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  store:           buildStore(),
  handler:         rateLimitHandler,
  // ipKeyGenerator handles IPv4-mapped IPv6 correctly
  keyGenerator:    (req) => ipKeyGenerator(req),
});

// ── Auth limiter — login/register, counts failures only ───────────────────────
const authLimiter = rateLimit({
  windowMs:               RATE_LIMITS.AUTH_WINDOW_MS,
  max:                    RATE_LIMITS.AUTH_MAX,
  standardHeaders:        true,
  legacyHeaders:          false,
  store:                  buildStore(),
  handler:                rateLimitHandler,
  skipSuccessfulRequests: true,
  keyGenerator:           (req) => ipKeyGenerator(req),
});

// ── Upload limiter — file upload endpoint ─────────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs:        RATE_LIMITS.UPLOAD_WINDOW_MS,
  max:             RATE_LIMITS.UPLOAD_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  store:           buildStore(),
  handler:         rateLimitHandler,
  keyGenerator:    userOrIpKey,
});

// ── Data write limiter — POST/PUT/DELETE on /data ─────────────────────────────
const dataWriteLimiter = rateLimit({
  windowMs:        RATE_LIMITS.DATA_WRITE_WINDOW,
  max:             RATE_LIMITS.DATA_WRITE_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  store:           buildStore(),
  handler:         rateLimitHandler,
  keyGenerator:    userOrIpKey,
});

module.exports = {
  globalLimiter,
  authLimiter,
  uploadLimiter,
  dataWriteLimiter,
};
