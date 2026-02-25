import { Submission, Problem, User } from '../models/index.js';
import { cacheService } from '../lib/cache.js';
import { logger } from '../lib/logger.js';

class AnalyticsService {
  async trackSubmission(userId, problemId, status) {
    try {
      const date = new Date().toISOString().split('T')[0];
      await cacheService.incrementCounter(`analytics:submissions:${date}`);
      await cacheService.incrementCounter(`analytics:user:${userId}:submissions:${date}`);
      
      if (status === 'Accepted') {
        await cacheService.incrementCounter(`analytics:accepted:${date}`);
      }

      logger.debug(`Submission tracked for user ${userId}`);
    } catch (error) {
      logger.error('Error tracking submission:', error);
    }
  }

  async getSystemStats() {
    try {
      const [totalUsers, totalProblems, totalSubmissions] = await Promise.all([
        User.countDocuments(),
        Problem.countDocuments(),
        Submission.countDocuments(),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todaySubmissions = await cacheService.getCounter(`analytics:submissions:${today}`);
      const todayAccepted = await cacheService.getCounter(`analytics:accepted:${today}`);

      return {
        totalUsers,
        totalProblems,
        totalSubmissions,
        todaySubmissions,
        todayAccepted,
        acceptanceRate: todaySubmissions > 0 
          ? ((todayAccepted / todaySubmissions) * 100).toFixed(2) 
          : 0,
      };
    } catch (error) {
      logger.error('Error getting system stats:', error);
      throw error;
    }
  }

  async getUserActivity(userId, days = 30) {
    try {
      const activity = [];
      const today = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const submissions = await cacheService.getCounter(
          `analytics:user:${userId}:submissions:${dateStr}`
        );

        activity.push({
          date: dateStr,
          submissions,
        });
      }

      return activity.reverse();
    } catch (error) {
      logger.error('Error getting user activity:', error);
      throw error;
    }
  }

  async getProblemStats(problemId) {
    try {
      const [totalSubmissions, acceptedSubmissions] = await Promise.all([
        Submission.countDocuments({ problemId }),
        Submission.countDocuments({ problemId, status: 'Accepted' }),
      ]);

      return {
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate: totalSubmissions > 0
          ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(2)
          : 0,
      };
    } catch (error) {
      logger.error('Error getting problem stats:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
