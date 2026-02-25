import { redisManager } from './redis.js';
import { logger } from './logger.js';

class RateLimiter {
  constructor() {
    this.limits = {
      codeExecution: { max: 10, window: 60 }, // 10 per minute
      api: { max: 100, window: 60 }, // 100 per minute
      auth: { max: 5, window: 300 }, // 5 per 5 minutes
    };
  }

  async checkLimit(userId, type = 'api') {
    try {
      const limit = this.limits[type];
      if (!limit) {
        logger.warn(`Unknown rate limit type: ${type}`);
        return { allowed: true };
      }

      const key = `ratelimit:${type}:${userId}`;
      const client = redisManager.getClient();

      const current = await client.incr(key);
      
      if (current === 1) {
        await client.expire(key, limit.window);
      }

      const ttl = await client.ttl(key);
      const allowed = current <= limit.max;

      if (!allowed) {
        logger.warn(`Rate limit exceeded for user ${userId}, type ${type}`);
      }

      return {
        allowed,
        current,
        limit: limit.max,
        remaining: Math.max(0, limit.max - current),
        resetIn: ttl,
      };
    } catch (error) {
      logger.error('Rate limiter error:', error);
      return { allowed: true };
    }
  }

  async resetLimit(userId, type = 'api') {
    try {
      const key = `ratelimit:${type}:${userId}`;
      await redisManager.del(key);
      logger.info(`Rate limit reset for user ${userId}, type ${type}`);
      return true;
    } catch (error) {
      logger.error('Error resetting rate limit:', error);
      return false;
    }
  }

  middleware(type = 'api') {
    return async (req, res, next) => {
      if (!req.user || !req.user.id) {
        return next();
      }

      const result = await this.checkLimit(req.user.id, type);

      res.setHeader('X-RateLimit-Limit', result.limit || 100);
      res.setHeader('X-RateLimit-Remaining', result.remaining || 0);
      res.setHeader('X-RateLimit-Reset', result.resetIn || 0);

      if (!result.allowed) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: result.resetIn,
        });
      }

      next();
    };
  }
}

export const rateLimiter = new RateLimiter();
