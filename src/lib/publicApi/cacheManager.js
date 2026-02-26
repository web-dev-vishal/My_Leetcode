import crypto from 'crypto';
import { redisManager } from '../redis.js';
import { logger } from '../logger.js';

class APICacheManager {
  constructor() {
    this.prefix = 'api';
  }

  /**
   * Generate cache key from API name, endpoint, and params
   * @param {string} apiName - API name
   * @param {string} endpoint - Endpoint path
   * @param {Object} params - Query parameters
   * @returns {string} - Cache key
   */
  generateKey(apiName, endpoint, params = {}) {
    // Sort parameters to ensure consistent key generation
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});

    const paramString = JSON.stringify(sortedParams);
    const hash = crypto.createHash('md5').update(paramString).digest('hex');

    return `${this.prefix}:${apiName}:${endpoint}:${hash}`;
  }

  /**
   * Get cached response
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Cached data or null
   */
  async get(key) {
    try {
      const cached = await redisManager.get(key);
      if (cached) {
        logger.debug(`Cache hit: ${key}`);
        return cached;
      }
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Error getting cache for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached response with TTL
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, data, ttl) {
    try {
      await redisManager.set(key, data, ttl);
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(`Error setting cache for ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by API name
   * @param {string} apiName - API name
   * @returns {Promise<boolean>} - Success status
   */
  async invalidateByAPI(apiName) {
    try {
      const client = redisManager.getClient();
      const pattern = `${this.prefix}:${apiName}:*`;
      
      // Get all keys matching pattern
      const keys = await client.keys(pattern);
      
      if (keys.length > 0) {
        await client.del(...keys);
        logger.info(`Invalidated ${keys.length} cache entries for API: ${apiName}`);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error invalidating cache for API ${apiName}:`, error);
      return false;
    }
  }

  /**
   * Invalidate specific cache key
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async invalidate(key) {
    try {
      await redisManager.del(key);
      logger.info(`Invalidated cache: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Error invalidating cache ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   * @param {string} pattern - Key pattern
   * @returns {Promise<boolean>} - Success status
   */
  async invalidateByPattern(pattern) {
    try {
      const client = redisManager.getClient();
      const keys = await client.keys(pattern);
      
      if (keys.length > 0) {
        await client.del(...keys);
        logger.info(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error invalidating cache by pattern ${pattern}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics for an API
   * @param {string} apiName - API name
   * @returns {Promise<Object>} - Cache statistics
   */
  async getStats(apiName) {
    try {
      const client = redisManager.getClient();
      const pattern = `${this.prefix}:${apiName}:*`;
      const keys = await client.keys(pattern);

      return {
        apiName,
        totalKeys: keys.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error getting cache stats for ${apiName}:`, error);
      return {
        apiName,
        totalKeys: 0,
        error: error.message
      };
    }
  }
}

export default APICacheManager;
