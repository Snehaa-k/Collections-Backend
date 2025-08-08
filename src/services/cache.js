const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      };
      
      // Only add password if it exists and is not empty
      if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.trim()) {
        redisConfig.password = process.env.REDIS_PASSWORD;
      }
      
      this.redis = new Redis(redisConfig);

      this.redis.on('error', (err) => {
        logger.warn('Redis connection error (falling back to memory):', err.message);
        this.isConnected = false;
      });

      this.redis.on('connect', () => {
        logger.info('Connected to Redis');
        this.isConnected = true;
      });
    } catch (error) {
      logger.warn('Redis initialization failed, using memory cache');
      this.memoryCache = new Map();
    }
  }

  async get(key) {
    try {
      if (this.redis && this.isConnected) {
        return await this.redis.get(key);
      }
      // Fallback to memory cache
      return this.memoryCache?.get(key) || null;
    } catch (error) {
      logger.warn('Cache get error, using fallback:', error.message);
      return this.memoryCache?.get(key) || null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      if (this.redis && this.isConnected) {
        if (ttl) {
          return await this.redis.setex(key, ttl, value);
        }
        return await this.redis.set(key, value);
      }
      // Fallback to memory cache
      if (this.memoryCache) {
        this.memoryCache.set(key, value);
        if (ttl) {
          setTimeout(() => this.memoryCache.delete(key), ttl * 1000);
        }
      }
      return true;
    } catch (error) {
      logger.warn('Cache set error, using fallback:', error.message);
      if (this.memoryCache) {
        this.memoryCache.set(key, value);
      }
      return false;
    }
  }

  async del(pattern) {
    try {
      if (pattern.includes('*')) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          return await this.redis.del(...keys);
        }
        return 0;
      }
      return await this.redis.del(pattern);
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      return await this.redis.exists(key);
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  async incr(key) {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      logger.error('Cache increment error:', error);
      return null;
    }
  }

  async expire(key, ttl) {
    try {
      return await this.redis.expire(key, ttl);
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }
}

module.exports = new CacheService();