import { leaderboardService } from '../services/leaderboardService.js';
import { logger } from '../lib/logger.js';

export const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const leaderboard = await leaderboardService.getGlobalLeaderboard(limit);

    res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
};

export const getUserRank = async (req, res) => {
  try {
    const userId = req.user.id;
    const rank = await leaderboardService.getUserRank(userId);

    res.status(200).json({
      success: true,
      rank,
    });
  } catch (error) {
    logger.error('Error getting user rank:', error);
    res.status(500).json({ error: 'Failed to get user rank' });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const stats = await leaderboardService.getUserStats(userId);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
};
