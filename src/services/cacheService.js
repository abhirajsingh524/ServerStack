/**
 * CogniVault Cache Service
 * Unified caching layer with Redis primary + NodeCache fallback.
 * All methods are safe — cache misses return null, never throw.
 */
const NodeCache = require('node-cache');
const { getRedisClient, isRedisReady } = require('../config/redis');
const logger = require('../config/logger');
const { CACHE_TTL } = require('../constants');

// ── In-memory fallback cache ──────────────────────────────────────────────────
const memCache = new NodeCache({
  stdTTL:      CACHE_TTL.DATA_LIST,
  checkperiod: 120,
  useClones:   false,
});

// ── Core operations ───────────────────────────────────────────────────────────

/**
 * Get a cached value.
 * @param {string} key
 * @returns {any|null} Parsed value or null on miss/error
 */
const get = async (key) => {
  try {
    if (isRedisReady()) {
      const val = await getRedisClient().get(key);
      return val ? JSON.parse(val) : null;
    }
    const val = memCache.get(key);
    return val !== undefined ? val : null;
  } catch (err) {
    logger.warn('[CACHE] GET error', { key, error: err.message });
    return null;
  }
};

/**
 * Set a cached value with TTL.
 * @param {string} key
 * @param {any}    value
 * @param {number} ttl   - seconds (default: CACHE_TTL.DATA_LIST)
 */
const set = async (key, value, ttl = CACHE_TTL.DATA_LIST) => {
  try {
    if (isRedisReady()) {
      await getRedisClient().setex(key, ttl, JSON.stringify(value));
    } else {
      memCache.set(key, value, ttl);
    }
  } catch (err) {
    logger.warn('[CACHE] SET error', { key, error: err.message });
  }
};

/**
 * Delete a cached value.
 * @param {string} key
 */
const del = async (key) => {
  try {
    if (isRedisReady()) {
      await getRedisClient().del(key);
    } else {
      memCache.del(key);
    }
  } catch (err) {
    logger.warn('[CACHE] DEL error', { key, error: err.message });
  }
};

/**
 * Delete all keys matching a pattern.
 * Redis: uses SCAN for safe pattern deletion.
 * Memory: deletes keys starting with prefix.
 * @param {string} pattern - e.g. "data:list:*"
 */
const delPattern = async (pattern) => {
  try {
    if (isRedisReady()) {
      const redis = getRedisClient();
      // Use SCAN to avoid blocking Redis with KEYS
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    } else {
      // NodeCache: filter keys by prefix
      const prefix = pattern.replace('*', '');
      const keys   = memCache.keys().filter(k => k.startsWith(prefix));
      keys.forEach(k => memCache.del(k));
    }
  } catch (err) {
    logger.warn('[CACHE] DEL PATTERN error', { pattern, error: err.message });
  }
};

/**
 * Cache-aside helper: get from cache, or fetch + cache.
 * @param {string}   key
 * @param {Function} fetchFn  - async function that returns the value
 * @param {number}   ttl      - seconds
 */
const getOrSet = async (key, fetchFn, ttl = CACHE_TTL.DATA_LIST) => {
  const cached = await get(key);
  if (cached !== null) {
    logger.debug('[CACHE] HIT', { key });
    return cached;
  }

  logger.debug('[CACHE] MISS', { key });
  const value = await fetchFn();
  if (value !== null && value !== undefined) {
    await set(key, value, ttl);
  }
  return value;
};

/**
 * Flush all cache entries (use with caution).
 */
const flush = async () => {
  try {
    if (isRedisReady()) {
      await getRedisClient().flushdb();
    } else {
      memCache.flushAll();
    }
    logger.info('[CACHE] Flushed all entries');
  } catch (err) {
    logger.warn('[CACHE] FLUSH error', { error: err.message });
  }
};

/**
 * Get cache stats for monitoring.
 */
const stats = () => {
  if (isRedisReady()) {
    return { backend: 'redis', status: 'connected' };
  }
  const s = memCache.getStats();
  return { backend: 'memory', ...s };
};

module.exports = { get, set, del, delPattern, getOrSet, flush, stats };
