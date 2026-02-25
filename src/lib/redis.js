import Redis from 'ioredis';
import { logger } from './logger.js';

class RedisManager {
  constructor() {
    if (RedisManager.instance) {
      return RedisManager.instance;
    }

    this.client = null;
    this.subscriber = null;
    this.publisher = null;
    this.isConnected = false;

    RedisManager.instance = this;
  }

  connect() {
    if (this.isConnected) {
      return this.client;
    }

    const config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    };

    this.client = new Redis(config);
    this.subscriber = new Redis(config);
    this.publisher = new Redis(config);

    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      logger.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.subscriber.on('error', (err) => {
      logger.error('Redis subscriber error:', err);
    });

    this.publisher.on('error', (err) => {
      logger.error('Redis publisher error:', err);
    });

    return this.client;
  }

  getClient() {
    if (!this.client) {
      this.connect();
    }
    return this.client;
  }

  getSubscriber() {
    if (!this.subscriber) {
      this.connect();
    }
    return this.subscriber;
  }

  getPublisher() {
    if (!this.publisher) {
      this.connect();
    }
    return this.publisher;
  }

  async set(key, value, ttl = null) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key) {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async publish(channel, message) {
    try {
      const serialized = JSON.stringify(message);
      await this.publisher.publish(channel, serialized);
      return true;
    } catch (error) {
      logger.error(`Redis PUBLISH error for channel ${channel}:`, error);
      return false;
    }
  }

  async subscribe(channel, callback) {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            const parsed = JSON.parse(message);
            callback(parsed);
          } catch (error) {
            logger.error(`Error parsing message from channel ${channel}:`, error);
          }
        }
      });
      return true;
    } catch (error) {
      logger.error(`Redis SUBSCRIBE error for channel ${channel}:`, error);
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.client) await this.client.quit();
      if (this.subscriber) await this.subscriber.quit();
      if (this.publisher) await this.publisher.quit();
      this.isConnected = false;
      logger.info('Redis connections closed');
    } catch (error) {
      logger.error('Error disconnecting Redis:', error);
    }
  }
}

export const redisManager = new RedisManager();
export const redis = redisManager.getClient();
