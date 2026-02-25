import express from "express"; 
import { createServer } from "http";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import { redisManager } from "./lib/redis.js";
import { rabbitMQ } from "./lib/rabbitmq.js";
import { socketManager } from "./lib/socket.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { securityHeaders, requestLogger, sanitizeInput } from "./middlewares/security.middleware.js";

import authRouter from "./routes/auth.routes.js";
import problemRoutes from "./routes/problem.routes.js"
import executecodeRoutes from "./routes/executeCode.routes.js";
import submissionsRoutes from "./routes/submission.routes.js";
import playListroutes from "./routes/playlist.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import healthRoutes from "./routes/health.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { rateLimiter } from "./lib/rateLimiter.js";
                                                                                                                                                                                                                                                                                                                                                                                       
dotenv.config({ path: {debug: true} });

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 8080;

let isShuttingDown = false;

async function startServer() {
  try {
    await connectDB();
    logger.info('MongoDB connected');

    redisManager.connect();
    logger.info('Redis connected');

    await rabbitMQ.connect();
    logger.info('RabbitMQ connected');

    socketManager.initialize(server);
    logger.info('Socket.IO initialized');

    redisManager.subscribe('submission:completed', (data) => {
      socketManager.emitToUser(data.userId, 'submission:completed', data);
    });

    app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    app.use(securityHeaders);
    app.use(requestLogger);
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(sanitizeInput);
    app.use(morgan("dev"));
    app.use(cookieParser());

    app.disable('x-powered-by');

    app.get('/', (req, res) => {
        res.json({ 
            success: true,
            message: "Welcome to leetcode api"
        })
    });

    app.use("/api/v1/auth", authRouter);
    app.use('/api/v1/problems', problemRoutes);
    app.use("/api/v1/execute-code", rateLimiter.middleware('codeExecution'), executecodeRoutes);
    app.use("/api/v1/submission", submissionsRoutes);
    app.use("/api/v1/playlist", playListroutes);
    app.use("/api/v1/leaderboard", leaderboardRoutes);
    app.use("/api/v1/health", healthRoutes);
    app.use("/api/v1/ai", aiRoutes);

    app.use(errorHandler);

    server.listen(PORT, () =>{ 
        logger.info(`Server listening at http://localhost:${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully...`);

  server.close(async () => {
    try {
      await socketManager.disconnect();
      await rabbitMQ.disconnect();
      await redisManager.disconnect();
      
      logger.info('Server shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
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

startServer();