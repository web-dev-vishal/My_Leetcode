import { aiService } from '../services/aiService.js';
import { logger } from '../lib/logger.js';

export const getHint = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { code } = req.body;
    const userId = req.user.id;

    const result = await aiService.getHint(problemId, userId, code);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      hint: result.content,
      cached: result.cached || false,
      usage: result.usage,
    });
  } catch (error) {
    logger.error('Error in getHint controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate hint',
    });
  }
};

export const explainProblem = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user.id;

    const result = await aiService.explainProblem(problemId, userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      explanation: result.content,
      cached: result.cached || false,
      usage: result.usage,
    });
  } catch (error) {
    logger.error('Error in explainProblem controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to explain problem',
    });
  }
};

export const analyzeCode = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { code, language } = req.body;
    const userId = req.user.id;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required',
      });
    }

    const result = await aiService.analyzeCode(problemId, userId, code, language);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      analysis: result.content,
      usage: result.usage,
    });
  } catch (error) {
    logger.error('Error in analyzeCode controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze code',
    });
  }
};

export const suggestOptimization = async (req, res) => {
  try {
    const { code, language, currentComplexity } = req.body;
    const userId = req.user.id;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required',
      });
    }

    const result = await aiService.suggestOptimization(
      userId,
      code,
      language,
      currentComplexity || 'Unknown'
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      suggestions: result.content,
      usage: result.usage,
    });
  } catch (error) {
    logger.error('Error in suggestOptimization controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to suggest optimization',
    });
  }
};

export const generateTestCases = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user.id;

    const result = await aiService.generateTestCases(problemId, userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      testCases: result.content,
      cached: result.cached || false,
      usage: result.usage,
    });
  } catch (error) {
    logger.error('Error in generateTestCases controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate test cases',
    });
  }
};

export const explainSolution = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { solution, language } = req.body;
    const userId = req.user.id;

    if (!solution || !language) {
      return res.status(400).json({
        success: false,
        error: 'Solution and language are required',
      });
    }

    const result = await aiService.explainSolution(problemId, userId, solution, language);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      explanation: result.content,
      usage: result.usage,
    });
  } catch (error) {
    logger.error('Error in explainSolution controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to explain solution',
    });
  }
};

export const debugCode = async (req, res) => {
  try {
    const { code, language, error: errorMessage } = req.body;
    const userId = req.user.id;

    if (!code || !language || !errorMessage) {
      return res.status(400).json({
        success: false,
        error: 'Code, language, and error message are required',
      });
    }

    const result = await aiService.debugCode(userId, code, language, errorMessage);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      debug: result.content,
      usage: result.usage,
    });
  } catch (error) {
    logger.error('Error in debugCode controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to debug code',
    });
  }
};

export const compareApproaches = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { approach1, approach2 } = req.body;
    const userId = req.user.id;

    if (!approach1 || !approach2) {
      return res.status(400).json({
        success: false,
        error: 'Both approaches are required',
      });
    }

    const result = await aiService.compareApproaches(
      problemId,
      userId,
      approach1,
      approach2
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      comparison: result.content,
      usage: result.usage,
    });
  } catch (error) {
    logger.error('Error in compareApproaches controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to compare approaches',
    });
  }
};

export const getUsageStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const stats = await aiService.getUserUsageStats(userId, days);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Error in getUsageStats controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get usage stats',
    });
  }
};
