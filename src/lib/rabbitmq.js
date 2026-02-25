import amqp from 'amqplib';
import { logger } from './logger.js';

class RabbitMQManager {
  constructor() {
    if (RabbitMQManager.instance) {
      return RabbitMQManager.instance;
    }

    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectTimeout = null;
    this.queues = new Map();

    RabbitMQManager.instance = this;
  }

  async connect() {
    if (this.isConnected && this.connection) {
      return this.connection;
    }

    try {
      const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      
      this.connection = await amqp.connect(url, {
        heartbeat: 60,
      });

      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
        this.reconnect();
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        this.reconnect();
      });

      this.channel = await this.connection.createChannel();
      
      this.channel.on('error', (err) => {
        logger.error('RabbitMQ channel error:', err);
      });

      this.channel.on('close', () => {
        logger.warn('RabbitMQ channel closed');
      });

      await this.channel.prefetch(10);

      this.isConnected = true;
      logger.info('RabbitMQ connected successfully');

      await this.setupQueues();

      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      this.reconnect();
      throw error;
    }
  }

  reconnect() {
    if (this.reconnectTimeout) {
      return;
    }

    this.reconnectTimeout = setTimeout(async () => {
      logger.info('Attempting to reconnect to RabbitMQ...');
      this.reconnectTimeout = null;
      try {
        await this.connect();
      } catch (error) {
        logger.error('Reconnection failed:', error);
      }
    }, 5000);
  }

  async setupQueues() {
    const queues = [
      {
        name: 'code_execution',
        options: {
          durable: true,
          deadLetterExchange: 'dlx',
          deadLetterRoutingKey: 'code_execution_dlq',
        },
      },
      {
        name: 'code_execution_dlq',
        options: { durable: true },
      },
      {
        name: 'notifications',
        options: { durable: true },
      },
    ];

    await this.channel.assertExchange('dlx', 'direct', { durable: true });

    for (const queue of queues) {
      await this.channel.assertQueue(queue.name, queue.options);
      this.queues.set(queue.name, queue);
      logger.info(`Queue ${queue.name} asserted`);
    }

    await this.channel.bindQueue('code_execution_dlq', 'dlx', 'code_execution_dlq');
  }

  async publish(queue, message, options = {}) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const content = Buffer.from(JSON.stringify(message));
      
      const publishOptions = {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
        ...options,
      };

      const sent = this.channel.sendToQueue(queue, content, publishOptions);

      if (!sent) {
        logger.warn(`Message not sent to queue ${queue}, buffer full`);
        return false;
      }

      logger.debug(`Message published to queue ${queue}`);
      return true;
    } catch (error) {
      logger.error(`Error publishing to queue ${queue}:`, error);
      return false;
    }
  }

  async consume(queue, handler, options = {}) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const consumeOptions = {
        noAck: false,
        ...options,
      };

      await this.channel.consume(
        queue,
        async (msg) => {
          if (!msg) return;

          try {
            const content = JSON.parse(msg.content.toString());
            logger.debug(`Processing message from queue ${queue}`);

            await handler(content, msg);

            this.channel.ack(msg);
            logger.debug(`Message acknowledged from queue ${queue}`);
          } catch (error) {
            logger.error(`Error processing message from queue ${queue}:`, error);

            const retryCount = (msg.properties.headers['x-retry-count'] || 0) + 1;
            const maxRetries = 3;

            if (retryCount < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
              
              setTimeout(() => {
                this.channel.nack(msg, false, true);
              }, delay);

              logger.info(`Message requeued with retry count ${retryCount}`);
            } else {
              this.channel.nack(msg, false, false);
              logger.error(`Message rejected after ${maxRetries} retries`);
            }
          }
        },
        consumeOptions
      );

      logger.info(`Consumer started for queue ${queue}`);
    } catch (error) {
      logger.error(`Error setting up consumer for queue ${queue}:`, error);
      throw error;
    }
  }

  async getQueueStats(queue) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const stats = await this.channel.checkQueue(queue);
      return {
        messageCount: stats.messageCount,
        consumerCount: stats.consumerCount,
      };
    } catch (error) {
      logger.error(`Error getting stats for queue ${queue}:`, error);
      return null;
    }
  }

  async purgeQueue(queue) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.channel.purgeQueue(queue);
      logger.info(`Queue ${queue} purged`);
      return true;
    } catch (error) {
      logger.error(`Error purging queue ${queue}:`, error);
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      if (this.channel) {
        await this.channel.close();
      }

      if (this.connection) {
        await this.connection.close();
      }

      this.isConnected = false;
      logger.info('RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error disconnecting RabbitMQ:', error);
    }
  }
}

export const rabbitMQ = new RabbitMQManager();
