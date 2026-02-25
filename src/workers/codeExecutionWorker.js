import { rabbitMQ } from '../lib/rabbitmq.js';
import { redisManager } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { Submission, ProblemSolved } from '../models/index.js';
import {
  getLanguageName,
  pollBatchResults,
  submitBatch,
} from '../lib/judge0.js';
import { notificationService } from '../services/notificationService.js';
import { leaderboardService } from '../services/leaderboardService.js';
import { analyticsService } from '../services/analyticsService.js';

class CodeExecutionWorker {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Code execution worker already running');
      return;
    }

    this.isRunning = true;

    await rabbitMQ.consume('code_execution', async (message, rawMsg) => {
      await this.processCodeExecution(message);
    });

    logger.info('Code execution worker started');
  }

  async processCodeExecution(job) {
    const { userId, problemId, source_code, language_id, stdin, expected_outputs, submissionId } = job;

    try {
      logger.info(`Processing code execution for submission ${submissionId}`);

      await redisManager.set(`submission:${submissionId}:status`, 'processing', 300);

      const submissions = stdin.map((input) => ({
        source_code,
        language_id,
        stdin: input,
        base64_encoded: false,
        wait: false,
      }));

      const submitResponse = await submitBatch(submissions);
      const tokens = submitResponse.map((res) => res.token);

      const results = await pollBatchResults(tokens);

      let allPassed = true;
      const detailedResults = results.map((result, i) => {
        const stdout = result.stdout?.trim() || null;
        const expected_output = expected_outputs[i]?.trim();
        const passed = stdout === expected_output;

        if (!passed) allPassed = false;

        return {
          testCase: i + 1,
          passed,
          stdout,
          expected: expected_output,
          stderr: result.stderr || null,
          compile_output: result.compile_output || null,
          status: result.status.description,
          memory: result.memory ? `${result.memory} KB` : undefined,
          time: result.time ? `${result.time} s` : undefined,
        };
      });

      const testCaseResults = detailedResults.map((result) => ({
        testCase: result.testCase,
        passed: result.passed,
        stdout: result.stdout,
        expected: result.expected,
        stderr: result.stderr,
        compileOutput: result.compile_output,
        status: result.status,
        memory: result.memory,
        time: result.time,
      }));

      const submission = await Submission.create({
        userId,
        problemId,
        sourceCode: source_code,
        language: getLanguageName(language_id),
        stdin: stdin.join('\n'),
        stdout: JSON.stringify(detailedResults.map((r) => r.stdout)),
        stderr: detailedResults.some((r) => r.stderr)
          ? JSON.stringify(detailedResults.map((r) => r.stderr))
          : null,
        compileOutput: detailedResults.some((r) => r.compile_output)
          ? JSON.stringify(detailedResults.map((r) => r.compile_output))
          : null,
        status: allPassed ? 'Accepted' : 'Wrong Answer',
        memory: detailedResults.some((r) => r.memory)
          ? JSON.stringify(detailedResults.map((r) => r.memory))
          : null,
        time: detailedResults.some((r) => r.time)
          ? JSON.stringify(detailedResults.map((r) => r.time))
          : null,
        testCases: testCaseResults,
      });

      if (allPassed) {
        await ProblemSolved.findOneAndUpdate(
          { userId, problemId },
          { userId, problemId },
          { upsert: true, new: true }
        );

        await notificationService.notifyAchievement(userId, {
          type: 'problem_solved',
          message: `Congratulations! You solved a problem!`,
          problemId,
        });

        setTimeout(() => {
          leaderboardService.updateLeaderboard().catch(err => 
            logger.error('Error updating leaderboard:', err)
          );
        }, 1000);
      }

      const result = {
        success: true,
        submission: {
          ...submission.toObject(),
          id: submission._id.toString(),
        },
      };

      await redisManager.set(`submission:${submissionId}:result`, result, 300);
      await redisManager.set(`submission:${submissionId}:status`, 'completed', 300);

      await redisManager.publish('submission:completed', {
        userId,
        submissionId: submission._id.toString(),
        status: submission.status,
        allPassed,
      });

      await notificationService.notifySubmissionComplete(userId, {
        id: submission._id.toString(),
        status: submission.status,
        problemId,
      });

      await analyticsService.trackSubmission(userId, problemId, submission.status);

      logger.info(`Code execution completed for submission ${submissionId}`);
    } catch (error) {
      logger.error(`Error processing code execution for submission ${submissionId}:`, error);

      await redisManager.set(`submission:${submissionId}:status`, 'failed', 300);
      await redisManager.set(
        `submission:${submissionId}:error`,
        { error: error.message },
        300
      );

      throw error;
    }
  }

  async stop() {
    this.isRunning = false;
    logger.info('Code execution worker stopped');
  }
}

export const codeExecutionWorker = new CodeExecutionWorker();
