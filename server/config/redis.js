const redis = require('redis');
const logger = require('../utils/logger');

let client = null;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB) || 0,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server refused connection');
          return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      },
    });

    client.on('connect', () => {
      logger.info('🔗 Redis client connected');
    });

    client.on('ready', () => {
      logger.info('✅ Redis client ready');
    });

    client.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    client.on('end', () => {
      logger.warn('Redis client connection ended');
    });

    client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    await client.connect();
    return client;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Don't exit process for Redis connection failure
    // Application can still work without caching
    return null;
  }
};

const getRedisClient = () => {
  if (!client) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return client;
};

const disconnectRedis = async () => {
  if (client) {
    try {
      await client.quit();
      logger.info('Redis client disconnected');
    } catch (error) {
      logger.error('Error disconnecting Redis client:', error);
    }
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectRedis();
});

process.on('SIGTERM', async () => {
  await disconnectRedis();
});

module.exports = {
  connectRedis,
  getRedisClient,
  disconnectRedis,
}; 