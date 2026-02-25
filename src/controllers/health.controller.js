import mongoose from 'mongoose';
import { redisManager } from '../lib/redis.js';
import { rabbitMQ } from '../lib/rabbitmq.js';
import { analyticsService } from '../services/analyticsService.js';
import { logger } from '../lib/logger.js';

export const healthCheck = async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {},
  };

  try {
    health.services.mongodb = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  } catch (error) {
    health.services.mongodb = 'error';
    health.status = 'unhealthy';
  }

  try {
    health.services.redis = redisManager.isConnected ? 'connected' : 'disconnected';
  } catch (error) {
    health.services.redis = 'error';
    health.status = 'unhealthy';
  }

  try {
    health.services.rabbitmq = rabbitMQ.isConnected ? 'connected' : 'disconnected';
  } catch (error) {
    health.services.rabbitmq = 'error';
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
};

export const detailedHealth = async (req, res) => {
  try {
    const [systemStats, queueStats] = await Promise.all([
      analyticsService.getSystemStats(),
      rabbitMQ.getQueueStats('code_execution'),
    ]);

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      system: systemStats,
      queues: {
        codeExecution: queueStats,
      },
      services: {
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        redis: redisManager.isConnected ? 'connected' : 'disconnected',
        rabbitmq: rabbitMQ.isConnected ? 'connected' : 'disconnected',
      },
    });
  } catch (error) {
    logger.error('Error getting detailed health:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
};
