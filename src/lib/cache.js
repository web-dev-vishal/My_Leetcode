import { redisManager } from './redis.js';
import { logger } from './logger.js';

class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hour
  }

  async cacheProblems(problems, ttl = this.defaultTTL) {
    try {
      await redisManager.set('problems:all', problems, ttl);
      logger.debug('Problems cached successfully');
      return true;
    } catch (error) {
      logger.error('Error caching problems:', error);
      return false;
    }
  }

  async getCachedProblems() {
    try {
      const cached = await redisManager.get('problems:all');
      if (cached) {
        logger.debug('Problems retrieved from cache');
      }
      return cached;
    } catch (error) {
      logger.error('Error getting cached problems:', error);
      return null;
    }
  }

  async cacheProblem(problemId, problem, ttl = this.defaultTTL) {
    try {
      await redisManager.set(`problem:${problemId}`, problem, ttl);
      logger.debug(`Problem ${problemId} cached`);
      return true;
    } catch (error) {
      logger.error(`Error caching problem ${problemId}:`, error);
      return false;
    }
  }

  async getCachedProblem(problemId) {
    try {
      const cached = await redisManager.get(`problem:${problemId}`);
      if (cached) {
        logger.debug(`Problem ${problemId} retrieved from cache`);
      }
      return cached;
    } catch (error) {
      logger.error(`Error getting cached problem ${problemId}:`, error);
      return null;
    }
  }

  async invalidateProblem(problemId) {
    try {
      await redisManager.del(`problem:${problemId}`);
      await redisManager.del('problems:all');
      logger.info(`Cache invalidated for problem ${problemId}`);
      return true;
    } catch (error) {
      logger.error(`Error invalidating cache for problem ${problemId}:`, error);
      return false;
    }
  }

  async cacheUserStats(userId, stats, ttl = 300) {
    try {
      await redisManager.set(`user:${userId}:stats`, stats, ttl);
      logger.debug(`User ${userId} stats cached`);
      return true;
    } catch (error) {
      logger.error(`Error caching user stats:`, error);
      return false;
    }
  }

  async getCachedUserStats(userId) {
    try {
      return await redisManager.get(`user:${userId}:stats`);
    } catch (error) {
      logger.error(`Error getting cached user stats:`, error);
      return null;
    }
  }

  async cacheLeaderboard(data, ttl = 300) {
    try {
      await redisManager.set('leaderboard:global', data, ttl);
      logger.debug('Leaderboard cached');
      return true;
    } catch (error) {
      logger.error('Error caching leaderboard:', error);
      return false;
    }
  }

  async getCachedLeaderboard() {
    try {
      return await redisManager.get('leaderboard:global');
    } catch (error) {
      logger.error('Error getting cached leaderboard:', error);
      return null;
    }
  }

  async incrementCounter(key, ttl = 86400) {
    try {
      const client = redisManager.getClient();
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, ttl);
      }
      return count;
    } catch (error) {
      logger.error(`Error incrementing counter ${key}:`, error);
      return null;
    }
  }

  async getCounter(key) {
    try {
      const client = redisManager.getClient();
      const count = await client.get(key);
      return count ? parseInt(count) : 0;
    } catch (error) {
      logger.error(`Error getting counter ${key}:`, error);
      return 0;
    }
  }
}

export const cacheService = new CacheService();
