/**
 * Redis client configuration.
 * Falls back gracefully to in-memory cache if Redis is unavailable.
 * This ensures the app works without Redis in development.
 */
const logger = require('./logger');

let redisClient = null;
let isRedisAvailable = false;

const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.info('[CACHE] REDIS_URL not set — using in-memory cache fallback');
    return null;
  }

  try {
    const { default: Redis } = await import('ioredis');
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 5000,
    });

    redisClient.on('connect',  () => { isRedisAvailable = true;  logger.info('[CACHE] Redis connected'); });
    redisClient.on('error',    (err) => { isRedisAvailable = false; logger.warn('[CACHE] Redis error', { error: err.message }); });
    redisClient.on('close',    () => { isRedisAvailable = false; logger.warn('[CACHE] Redis connection closed'); });

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    logger.warn('[CACHE] Redis connection failed — falling back to in-memory cache', { error: err.message });
    return null;
  }
};

const getRedisClient = () => redisClient;
const isRedisReady   = () => isRedisAvailable;

module.exports = { connectRedis, getRedisClient, isRedisReady };
