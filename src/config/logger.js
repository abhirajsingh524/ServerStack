/**
 * Winston structured logger configuration.
 * - JSON format in production (for log aggregators)
 * - Pretty format in development
 * - Daily rotating file transport
 * - Sensitive data masking
 */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// ── Sensitive field masking ───────────────────────────────────────────────────
const SENSITIVE_FIELDS = ['password', 'token', 'refreshToken', 'accessToken', 'secret', 'key', 'authorization'];

const maskSensitive = winston.format((info) => {
  const mask = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const masked = Array.isArray(obj) ? [...obj] : { ...obj };
    for (const key of Object.keys(masked)) {
      if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f))) {
        masked[key] = '[REDACTED]';
      } else if (typeof masked[key] === 'object') {
        masked[key] = mask(masked[key]);
      }
    }
    return masked;
  };
  return mask(info);
});

// ── Formats ───────────────────────────────────────────────────────────────────
const devFormat = winston.format.combine(
  maskSensitive(),
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

const prodFormat = winston.format.combine(
  maskSensitive(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ── Transports ────────────────────────────────────────────────────────────────
const transports = [];

// Console transport
transports.push(new winston.transports.Console({
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  silent: process.env.NODE_ENV === 'test',
}));

// File transports (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  // Error log — errors only
  transports.push(new DailyRotateFile({
    filename:     path.join('src', 'logs', 'error-%DATE%.log'),
    datePattern:  'YYYY-MM-DD',
    level:        'error',
    maxSize:      '20m',
    maxFiles:     '30d',
    format:       prodFormat,
    zippedArchive: true,
  }));

  // Combined log — all levels
  transports.push(new DailyRotateFile({
    filename:     path.join('src', 'logs', 'combined-%DATE%.log'),
    datePattern:  'YYYY-MM-DD',
    maxSize:      '50m',
    maxFiles:     '14d',
    format:       prodFormat,
    zippedArchive: true,
  }));
}

// ── Logger instance ───────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transports,
  exitOnError: false,
});

module.exports = logger;
