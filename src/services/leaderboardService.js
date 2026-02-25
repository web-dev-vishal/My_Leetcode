import { ProblemSolved, User } from '../models/index.js';
import { cacheService } from '../lib/cache.js';
import { socketManager } from '../lib/socket.js';
import { logger } from '../lib/logger.js';

class LeaderboardService {
  async getGlobalLeaderboard(limit = 100) {
    try {
      const cached = await cacheService.getCachedLeaderboard();
      if (cached) {
        return cached;
      }

      const leaderboard = await User.aggregate([
        {
          $lookup: {
            from: 'problemsolveds',
            localField: '_id',
            foreignField: 'userId',
            as: 'solvedProblems',
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            problemsSolved: { $size: '$solvedProblems' },
          },
        },
        {
          $sort: { problemsSolved: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      const formattedLeaderboard = leaderboard.map((user, index) => ({
        rank: index + 1,
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        problemsSolved: user.problemsSolved,
      }));

      await cacheService.cacheLeaderboard(formattedLeaderboard, 300);

      return formattedLeaderboard;
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  async updateLeaderboard() {
    try {
      const leaderboard = await this.getGlobalLeaderboard();
      
      socketManager.emitToNamespace('/leaderboard', 'leaderboard:update', {
        leaderboard,
        timestamp: Date.now(),
      });

      logger.info('Leaderboard updated and broadcasted');
      return leaderboard;
    } catch (error) {
      logger.error('Error updating leaderboard:', error);
      throw error;
    }
  }

  async getUserRank(userId) {
    try {
      const leaderboard = await this.getGlobalLeaderboard(1000);
      const userRank = leaderboard.find(entry => entry.userId === userId.toString());
      
      if (!userRank) {
        const solvedCount = await ProblemSolved.countDocuments({ userId });
        return {
          rank: null,
          problemsSolved: solvedCount,
          message: 'Not in top 1000',
        };
      }

      return userRank;
    } catch (error) {
      logger.error('Error getting user rank:', error);
      throw error;
    }
  }

  async getUserStats(userId) {
    try {
      const cached = await cacheService.getCachedUserStats(userId);
      if (cached) {
        return cached;
      }

      const solvedProblems = await ProblemSolved.find({ userId })
        .populate('problemId', 'difficulty')
        .lean();

      const stats = {
        totalSolved: solvedProblems.length,
        easy: solvedProblems.filter(p => p.problemId?.difficulty === 'Easy').length,
        medium: solvedProblems.filter(p => p.problemId?.difficulty === 'Medium').length,
        hard: solvedProblems.filter(p => p.problemId?.difficulty === 'Hard').length,
      };

      await cacheService.cacheUserStats(userId, stats, 300);

      return stats;
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }
}

export const leaderboardService = new LeaderboardService();
