import { openRouterClient } from '../lib/openrouter.js';
import { cacheService } from '../lib/cache.js';
import { logger } from '../lib/logger.js';
import { Problem } from '../models/index.js';

class AIService {
  constructor() {
    this.cacheTTL = {
      hint: 3600,
      explanation: 7200,
      analysis: 1800,
      testCases: 3600,
    };
  }

  async getHint(problemId, userId, userCode = null) {
    try {
      const cacheKey = `ai:hint:${problemId}:${userCode ? 'withcode' : 'nocode'}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        logger.debug('AI hint retrieved from cache', { problemId });
        return { ...cached, cached: true };
      }

      const problem = await Problem.findById(problemId).lean();
      if (!problem) {
        throw new Error('Problem not found');
      }

      const result = await openRouterClient.generateHint(problem, userCode);

      if (result.success) {
        await cacheService.set(cacheKey, result, this.cacheTTL.hint);
        await this.trackUsage(userId, 'hint', result.usage);
      }

      return result;
    } catch (error) {
      logger.error('Error getting AI hint', { error: error.message, problemId });
      throw error;
    }
  }

  async explainProblem(problemId, userId) {
    try {
      const cacheKey = `ai:explanation:${problemId}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        logger.debug('AI explanation retrieved from cache', { problemId });
        return { ...cached, cached: true };
      }

      const problem = await Problem.findById(problemId).lean();
      if (!problem) {
        throw new Error('Problem not found');
      }

      const result = await openRouterClient.explainProblem(problem);

      if (result.success) {
        await cacheService.set(cacheKey, result, this.cacheTTL.explanation);
        await this.trackUsage(userId, 'explanation', result.usage);
      }

      return result;
    } catch (error) {
      logger.error('Error explaining problem', { error: error.message, problemId });
      throw error;
    }
  }

  async analyzeCode(problemId, userId, code, language) {
    try {
      const problem = await Problem.findById(problemId).lean();
      if (!problem) {
        throw new Error('Problem not found');
      }

      const result = await openRouterClient.analyzeCode(code, language, problem);

      if (result.success) {
        await this.trackUsage(userId, 'analysis', result.usage);
      }

      return result;
    } catch (error) {
      logger.error('Error analyzing code', { error: error.message, problemId });
      throw error;
    }
  }

  async suggestOptimization(userId, code, language, currentComplexity) {
    try {
      const result = await openRouterClient.suggestOptimization(
        code,
        language,
        currentComplexity
      );

      if (result.success) {
        await this.trackUsage(userId, 'optimization', result.usage);
      }

      return result;
    } catch (error) {
      logger.error('Error suggesting optimization', { error: error.message });
      throw error;
    }
  }

  async generateTestCases(problemId, userId) {
    try {
      const cacheKey = `ai:testcases:${problemId}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        logger.debug('AI test cases retrieved from cache', { problemId });
        return { ...cached, cached: true };
      }

      const problem = await Problem.findById(problemId).lean();
      if (!problem) {
        throw new Error('Problem not found');
      }

      const result = await openRouterClient.generateTestCases(problem);

      if (result.success) {
        await cacheService.set(cacheKey, result, this.cacheTTL.testCases);
        await this.trackUsage(userId, 'testcases', result.usage);
      }

      return result;
    } catch (error) {
      logger.error('Error generating test cases', { error: error.message, problemId });
      throw error;
    }
  }

  async explainSolution(problemId, userId, solution, language) {
    try {
      const problem = await Problem.findById(problemId).lean();
      if (!problem) {
        throw new Error('Problem not found');
      }

      const result = await openRouterClient.explainSolution(problem, solution, language);

      if (result.success) {
        await this.trackUsage(userId, 'solution_explanation', result.usage);
      }

      return result;
    } catch (error) {
      logger.error('Error explaining solution', { error: error.message, problemId });
      throw error;
    }
  }

  async debugCode(userId, code, language, error) {
    try {
      const result = await openRouterClient.debugCode(code, language, error);

      if (result.success) {
        await this.trackUsage(userId, 'debug', result.usage);
      }

      return result;
    } catch (error) {
      logger.error('Error debugging code', { error: error.message });
      throw error;
    }
  }

  async compareApproaches(problemId, userId, approach1, approach2) {
    try {
      const problem = await Problem.findById(problemId).lean();
      if (!problem) {
        throw new Error('Problem not found');
      }

      const result = await openRouterClient.compareApproaches(
        problem,
        approach1,
        approach2
      );

      if (result.success) {
        await this.trackUsage(userId, 'comparison', result.usage);
      }

      return result;
    } catch (error) {
      logger.error('Error comparing approaches', { error: error.message, problemId });
      throw error;
    }
  }

  async trackUsage(userId, type, usage) {
    try {
      const date = new Date().toISOString().split('T')[0];
      await cacheService.incrementCounter(`ai:usage:${userId}:${date}`);
      await cacheService.incrementCounter(`ai:usage:${type}:${date}`);

      if (usage) {
        const tokensKey = `ai:tokens:${userId}:${date}`;
        const client = cacheService.redisManager?.getClient();
        if (client) {
          await client.incrby(tokensKey, usage.total_tokens || 0);
          await client.expire(tokensKey, 86400 * 30);
        }
      }

      logger.debug('AI usage tracked', { userId, type, usage });
    } catch (error) {
      logger.error('Error tracking AI usage', { error: error.message });
    }
  }

  async getUserUsageStats(userId, days = 30) {
    try {
      const stats = {
        totalRequests: 0,
        totalTokens: 0,
        byType: {},
        daily: [],
      };

      const today = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const requests = await cacheService.getCounter(`ai:usage:${userId}:${dateStr}`);
        const tokens = await cacheService.getCounter(`ai:tokens:${userId}:${dateStr}`);

        stats.totalRequests += requests;
        stats.totalTokens += tokens;

        stats.daily.push({
          date: dateStr,
          requests,
          tokens,
        });
      }

      return stats;
    } catch (error) {
      logger.error('Error getting user usage stats', { error: error.message });
      throw error;
    }
  }

  async checkHealth() {
    try {
      return await openRouterClient.getHealthStatus();
    } catch (error) {
      logger.error('Error checking AI service health', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
}

export const aiService = new AIService();
