import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  getLeaderboard,
  getUserRank,
  getUserStats,
} from '../controllers/leaderboard.controller.js';

const router = express.Router();

router.get('/', getLeaderboard);
router.get('/rank', authenticate, getUserRank);
router.get('/stats/:userId?', authenticate, getUserStats);

export default router;
