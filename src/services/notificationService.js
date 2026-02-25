import { rabbitMQ } from '../lib/rabbitmq.js';
import { socketManager } from '../lib/socket.js';
import { logger } from '../lib/logger.js';

class NotificationService {
  async sendNotification(userId, notification) {
    try {
      const message = {
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        timestamp: Date.now(),
      };

      await rabbitMQ.publish('notifications', message);

      socketManager.emitToUser(userId, 'notification', message);

      logger.info(`Notification sent to user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error sending notification:', error);
      return false;
    }
  }

  async notifySubmissionComplete(userId, submission) {
    return this.sendNotification(userId, {
      type: 'submission_complete',
      title: 'Submission Complete',
      message: `Your submission has been ${submission.status}`,
      data: {
        submissionId: submission.id,
        status: submission.status,
        problemId: submission.problemId,
      },
    });
  }

  async notifyNewProblem(userId, problem) {
    return this.sendNotification(userId, {
      type: 'new_problem',
      title: 'New Problem Available',
      message: `Check out the new problem: ${problem.title}`,
      data: {
        problemId: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
      },
    });
  }

  async notifyAchievement(userId, achievement) {
    return this.sendNotification(userId, {
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: achievement.message,
      data: achievement,
    });
  }

  async broadcastAnnouncement(announcement) {
    try {
      socketManager.broadcast('announcement', {
        title: announcement.title,
        message: announcement.message,
        timestamp: Date.now(),
      });

      logger.info('Announcement broadcasted');
      return true;
    } catch (error) {
      logger.error('Error broadcasting announcement:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
