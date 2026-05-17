/**
 * CogniVault — Centralized Constants
 * Single source of truth for all magic strings, enums, and limits.
 */

// ── Roles ─────────────────────────────────────────────────────────────────
const ROLES = Object.freeze({
  ADMIN:      'admin',
  RESEARCHER: 'researcher',
});

// ── Audit Actions ─────────────────────────────────────────────────────────
const AUDIT_ACTIONS = Object.freeze({
  LOGIN_SUCCESS:       'LOGIN_SUCCESS',
  LOGIN_FAILED:        'LOGIN_FAILED',
  REGISTER:            'REGISTER',
  LOGOUT:              'LOGOUT',
  TOKEN_REFRESH:       'TOKEN_REFRESH',
  DATA_CREATE:         'DATA_CREATE',
  DATA_READ:           'DATA_READ',
  DATA_UPDATE:         'DATA_UPDATE',
  DATA_DELETE:         'DATA_DELETE',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  DECRYPT_ACCESS:      'DECRYPT_ACCESS',
  FILE_UPLOAD:         'FILE_UPLOAD',
  ACCOUNT_DEACTIVATED: 'ACCOUNT_DEACTIVATED',
  ACCOUNT_ACTIVATED:   'ACCOUNT_ACTIVATED',
});

// ── Access Levels ─────────────────────────────────────────────────────────
const ACCESS_LEVELS = Object.freeze({
  PRIVATE: 'private',
  SHARED:  'shared',
  PUBLIC:  'public',
});

// ── Rate Limit Windows ────────────────────────────────────────────────────
const RATE_LIMITS = Object.freeze({
  GLOBAL_WINDOW_MS:  15 * 60 * 1000,  // 15 min
  GLOBAL_MAX:        200,
  AUTH_WINDOW_MS:    15 * 60 * 1000,
  AUTH_MAX:          15,
  UPLOAD_WINDOW_MS:  60 * 60 * 1000,  // 1 hour
  UPLOAD_MAX:        30,
  DATA_WRITE_WINDOW: 60 * 1000,       // 1 min
  DATA_WRITE_MAX:    20,
});

// ── Cache TTLs (seconds) ──────────────────────────────────────────────────
const CACHE_TTL = Object.freeze({
  USER_PROFILE:  300,   // 5 min
  DATA_LIST:     60,    // 1 min
  DATA_RECORD:   120,   // 2 min
  ADMIN_USERS:   120,
  LOGS:          30,
});

// ── Cache Key Prefixes ────────────────────────────────────────────────────
const CACHE_KEYS = Object.freeze({
  USER:       (id)         => `user:${id}`,
  DATA_LIST:  (userId)     => `data:list:${userId}`,
  DATA_ITEM:  (id)         => `data:item:${id}`,
  ADMIN_USERS:             'admin:users',
  LOGS:       (page, limit, action) => `logs:${page}:${limit}:${action || 'all'}`,
});

// ── Encryption ────────────────────────────────────────────────────────────
const ENCRYPTION = Object.freeze({
  ALGORITHM:  'aes-256-gcm',
  IV_LENGTH:  16,
  TAG_LENGTH: 16,
  VERSION:    'v1',  // bump when algorithm changes
});

// ── Pagination Defaults ───────────────────────────────────────────────────
const PAGINATION = Object.freeze({
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT:     100,
});

// ── Log Retention ─────────────────────────────────────────────────────────
const LOG_RETENTION = Object.freeze({
  TTL_SECONDS: 90 * 24 * 60 * 60, // 90 days
});

// ── HTTP Status Codes ─────────────────────────────────────────────────────
const HTTP = Object.freeze({
  OK:                    200,
  CREATED:               201,
  NO_CONTENT:            204,
  BAD_REQUEST:           400,
  UNAUTHORIZED:          401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  CONFLICT:              409,
  UNPROCESSABLE_ENTITY:  422,
  TOO_MANY_REQUESTS:     429,
  INTERNAL_SERVER_ERROR: 500,
});

module.exports = {
  ROLES,
  AUDIT_ACTIONS,
  ACCESS_LEVELS,
  RATE_LIMITS,
  CACHE_TTL,
  CACHE_KEYS,
  ENCRYPTION,
  PAGINATION,
  LOG_RETENTION,
  HTTP,
};
