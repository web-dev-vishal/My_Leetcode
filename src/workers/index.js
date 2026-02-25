import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../lib/db.js';
import { rabbitMQ } from '../lib/rabbitmq.js';
import { redisManager } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { codeExecutionWorker } from './codeExecutionWorker.js';

let isShuttingDown = false;

async function startWorker() {
  try {
    logger.info('Starting worker process...');

    await connectDB();
    logger.info('Database connected');

    redisManager.connect();
    logger.info('Redis connected');

    await rabbitMQ.connect();
    logger.info('RabbitMQ connected');

    await codeExecutionWorker.start();
    logger.info('Code execution worker started');

    logger.info('Worker process ready');
  } catch (error) {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    await codeExecutionWorker.stop();
    await rabbitMQ.disconnect();
    await redisManager.disconnect();
    
    logger.info('Worker shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

startWorker();
