import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisManager } from './redis.js';
import { logger } from './logger.js';
import jwt from 'jsonwebtoken';

class SocketManager {
  constructor() {
    if (SocketManager.instance) {
      return SocketManager.instance;
    }

    this.io = null;
    this.userSockets = new Map();

    SocketManager.instance = this;
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    });

    const pubClient = redisManager.getPublisher();
    const subClient = redisManager.getSubscriber();
    this.io.adapter(createAdapter(pubClient, subClient));

    this.setupMiddleware();
    this.setupNamespaces();
    this.setupEventHandlers();

    logger.info('Socket.IO initialized with Redis adapter');

    return this.io;
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;

        logger.debug(`Socket authenticated for user ${socket.userId}`);
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Invalid token'));
      }
    });
  }

  setupNamespaces() {
    const submissionsNamespace = this.io.of('/submissions');
    
    submissionsNamespace.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    submissionsNamespace.on('connection', (socket) => {
      logger.info(`User ${socket.userId} connected to submissions namespace`);

      socket.join(`user:${socket.userId}`);

      socket.on('disconnect', () => {
        logger.info(`User ${socket.userId} disconnected from submissions namespace`);
      });
    });

    const leaderboardNamespace = this.io.of('/leaderboard');
    
    leaderboardNamespace.on('connection', (socket) => {
      logger.info('Client connected to leaderboard namespace');

      socket.join('leaderboard');

      socket.on('disconnect', () => {
        logger.info('Client disconnected from leaderboard namespace');
      });
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}, User: ${socket.userId}`);

      this.userSockets.set(socket.userId, socket.id);

      socket.join(`user:${socket.userId}`);

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.id}, Reason: ${reason}`);
        this.userSockets.delete(socket.userId);
      });

      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });
    });

    this.io.engine.on('connection_error', (err) => {
      logger.error('Socket.IO connection error:', err);
    });
  }

  emitToUser(userId, event, data) {
    try {
      this.io.to(`user:${userId}`).emit(event, data);
      logger.debug(`Event ${event} emitted to user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error emitting to user ${userId}:`, error);
      return false;
    }
  }

  emitToRoom(room, event, data) {
    try {
      this.io.to(room).emit(event, data);
      logger.debug(`Event ${event} emitted to room ${room}`);
      return true;
    } catch (error) {
      logger.error(`Error emitting to room ${room}:`, error);
      return false;
    }
  }

  emitToNamespace(namespace, event, data) {
    try {
      this.io.of(namespace).emit(event, data);
      logger.debug(`Event ${event} emitted to namespace ${namespace}`);
      return true;
    } catch (error) {
      logger.error(`Error emitting to namespace ${namespace}:`, error);
      return false;
    }
  }

  broadcast(event, data) {
    try {
      this.io.emit(event, data);
      logger.debug(`Event ${event} broadcasted to all clients`);
      return true;
    } catch (error) {
      logger.error('Error broadcasting:', error);
      return false;
    }
  }

  getIO() {
    return this.io;
  }

  async disconnect() {
    try {
      if (this.io) {
        this.io.close();
        logger.info('Socket.IO server closed');
      }
    } catch (error) {
      logger.error('Error closing Socket.IO:', error);
    }
  }
}

export const socketManager = new SocketManager();
