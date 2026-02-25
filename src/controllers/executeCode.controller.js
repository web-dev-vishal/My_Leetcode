import { rabbitMQ } from '../lib/rabbitmq.js';
import { redisManager } from '../lib/redis.js';
import crypto from 'crypto';

export const executeCode = async (req, res) => {
  const { source_code, language_id, stdin, expected_outputs, problemId } = req.body;
  const userId = req.user.id;

  try {
    if (
      !Array.isArray(stdin) ||
      stdin.length === 0 ||
      !Array.isArray(expected_outputs) ||
      expected_outputs.length !== stdin.length
    ) {
      return res.status(400).json({ error: 'Invalid or missing test cases' });
    }

    const submissionId = crypto.randomUUID();

    const job = {
      submissionId,
      userId,
      problemId,
      source_code,
      language_id,
      stdin,
      expected_outputs,
      timestamp: Date.now(),
    };

    await rabbitMQ.publish('code_execution', job);

    await redisManager.set(`submission:${submissionId}:status`, 'queued', 300);

    res.status(202).json({
      success: true,
      message: 'Code execution queued',
      submissionId,
      status: 'queued',
    });
  } catch (error) {
    console.error('Error queueing code execution:', error.message);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: Object.values(error.errors).map(e => e.message) 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    res.status(500).json({ error: 'Failed to queue code execution' });
  }
};

export const getSubmissionStatus = async (req, res) => {
  const { submissionId } = req.params;

  try {
    const status = await redisManager.get(`submission:${submissionId}:status`);

    if (!status) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (status === 'completed') {
      const result = await redisManager.get(`submission:${submissionId}:result`);
      return res.status(200).json(result);
    }

    if (status === 'failed') {
      const error = await redisManager.get(`submission:${submissionId}:error`);
      return res.status(500).json({ error: 'Execution failed', details: error });
    }

    res.status(200).json({
      submissionId,
      status,
    });
  } catch (error) {
    console.error('Error getting submission status:', error.message);
    res.status(500).json({ error: 'Failed to get submission status' });
  }
};
