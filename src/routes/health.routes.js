import express from 'express';
import { healthCheck, detailedHealth } from '../controllers/health.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', healthCheck);
router.get('/detailed', authenticate, detailedHealth);

export default router;
