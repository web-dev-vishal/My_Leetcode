import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { rateLimiter } from '../lib/rateLimiter.js';
import {
  getHint,
  explainProblem,
  analyzeCode,
  suggestOptimization,
  generateTestCases,
  explainSolution,
  debugCode,
  compareApproaches,
  getUsageStats,
} from '../controllers/ai.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/hint/:problemId', rateLimiter.middleware('api'), getHint);
router.get('/explain/:problemId', rateLimiter.middleware('api'), explainProblem);
router.post('/analyze/:problemId', rateLimiter.middleware('api'), analyzeCode);
router.post('/optimize', rateLimiter.middleware('api'), suggestOptimization);
router.get('/testcases/:problemId', rateLimiter.middleware('api'), generateTestCases);
router.post('/explain-solution/:problemId', rateLimiter.middleware('api'), explainSolution);
router.post('/debug', rateLimiter.middleware('api'), debugCode);
router.post('/compare/:problemId', rateLimiter.middleware('api'), compareApproaches);
router.get('/usage', getUsageStats);

export default router;
