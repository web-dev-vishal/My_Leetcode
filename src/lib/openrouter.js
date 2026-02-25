import axios from 'axios';
import { logger } from './logger.js';

class OpenRouterClient {
  constructor() {
    if (OpenRouterClient.instance) {
      return OpenRouterClient.instance;
    }

    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.defaultModel = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
    this.timeout = parseInt(process.env.OPENROUTER_TIMEOUT) || 30000;
    this.maxRetries = 3;
    this.retryDelay = 1000;

    if (!this.apiKey) {
      logger.error('OpenRouter API key not configured');
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:8080',
        'X-Title': 'LeetCode Clone',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;

        if (!config || !config.retry) {
          config.retry = 0;
        }

        if (config.retry >= this.maxRetries) {
          logger.error('Max retries reached for OpenRouter API', {
            url: config.url,
            error: error.message,
          });
          return Promise.reject(error);
        }

        if (error.response?.status === 429 || error.code === 'ECONNABORTED') {
          config.retry += 1;
          const delay = this.retryDelay * Math.pow(2, config.retry - 1);

          logger.warn(`Retrying OpenRouter API call (${config.retry}/${this.maxRetries})`, {
            delay,
            url: config.url,
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );

    OpenRouterClient.instance = this;
  }

  async chat(messages, options = {}) {
    try {
      const payload = {
        model: options.model || this.defaultModel,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
        ...options.additionalParams,
      };

      logger.debug('OpenRouter API request', {
        model: payload.model,
        messageCount: messages.length,
      });

      const response = await this.client.post('/chat/completions', payload);

      logger.debug('OpenRouter API response received', {
        model: response.data.model,
        usage: response.data.usage,
      });

      return {
        success: true,
        content: response.data.choices[0]?.message?.content,
        model: response.data.model,
        usage: response.data.usage,
        finishReason: response.data.choices[0]?.finish_reason,
      };
    } catch (error) {
      logger.error('OpenRouter API error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        status: error.response?.status,
      };
    }
  }

  async generateHint(problem, userCode = null) {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful coding tutor. Provide hints without giving away the complete solution. Guide the user to think through the problem.',
      },
      {
        role: 'user',
        content: `Problem: ${problem.title}\n\nDescription: ${problem.description}\n\n${
          userCode ? `User's current code:\n\`\`\`\n${userCode}\n\`\`\`\n\n` : ''
        }Provide a helpful hint to solve this problem without revealing the complete solution.`,
      },
    ];

    return this.chat(messages, { temperature: 0.8, maxTokens: 500 });
  }

  async explainProblem(problem) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert programming instructor. Explain coding problems clearly and concisely.',
      },
      {
        role: 'user',
        content: `Explain this coding problem in simple terms:\n\nTitle: ${problem.title}\n\nDescription: ${problem.description}\n\nDifficulty: ${problem.difficulty}\n\nProvide a clear explanation of what the problem is asking and the key concepts involved.`,
      },
    ];

    return this.chat(messages, { temperature: 0.7, maxTokens: 800 });
  }

  async analyzeCode(code, language, problem) {
    const messages = [
      {
        role: 'system',
        content: 'You are a code review expert. Analyze code for correctness, efficiency, and best practices.',
      },
      {
        role: 'user',
        content: `Analyze this ${language} code for the following problem:\n\nProblem: ${problem.title}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide feedback on:\n1. Correctness\n2. Time complexity\n3. Space complexity\n4. Code quality\n5. Potential improvements`,
      },
    ];

    return this.chat(messages, { temperature: 0.5, maxTokens: 1000 });
  }

  async suggestOptimization(code, language, currentComplexity) {
    const messages = [
      {
        role: 'system',
        content: 'You are an algorithm optimization expert. Suggest ways to improve code efficiency.',
      },
      {
        role: 'user',
        content: `Current ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nCurrent complexity: ${currentComplexity}\n\nSuggest optimizations to improve time or space complexity. Explain the trade-offs.`,
      },
    ];

    return this.chat(messages, { temperature: 0.6, maxTokens: 1000 });
  }

  async generateTestCases(problem) {
    const messages = [
      {
        role: 'system',
        content: 'You are a test case generation expert. Create comprehensive test cases for coding problems.',
      },
      {
        role: 'user',
        content: `Generate test cases for this problem:\n\nTitle: ${problem.title}\n\nDescription: ${problem.description}\n\nProvide:\n1. Edge cases\n2. Normal cases\n3. Large input cases\n\nFormat: Input -> Expected Output`,
      },
    ];

    return this.chat(messages, { temperature: 0.5, maxTokens: 800 });
  }

  async explainSolution(problem, solution, language) {
    const messages = [
      {
        role: 'system',
        content: 'You are a programming educator. Explain solutions clearly with step-by-step reasoning.',
      },
      {
        role: 'user',
        content: `Explain this solution for the problem:\n\nProblem: ${problem.title}\n\nSolution (${language}):\n\`\`\`${language}\n${solution}\n\`\`\`\n\nProvide:\n1. Step-by-step explanation\n2. Key insights\n3. Time and space complexity analysis`,
      },
    ];

    return this.chat(messages, { temperature: 0.6, maxTokens: 1200 });
  }

  async debugCode(code, language, error) {
    const messages = [
      {
        role: 'system',
        content: 'You are a debugging expert. Help identify and fix code issues.',
      },
      {
        role: 'user',
        content: `Debug this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nError: ${error}\n\nIdentify the issue and suggest a fix.`,
      },
    ];

    return this.chat(messages, { temperature: 0.5, maxTokens: 800 });
  }

  async compareApproaches(problem, approach1, approach2) {
    const messages = [
      {
        role: 'system',
        content: 'You are an algorithm comparison expert. Compare different approaches objectively.',
      },
      {
        role: 'user',
        content: `Compare these two approaches for solving:\n\nProblem: ${problem.title}\n\nApproach 1:\n${approach1}\n\nApproach 2:\n${approach2}\n\nCompare:\n1. Time complexity\n2. Space complexity\n3. Readability\n4. When to use each`,
      },
    ];

    return this.chat(messages, { temperature: 0.6, maxTokens: 1000 });
  }

  async getHealthStatus() {
    try {
      const response = await this.client.get('/models');
      return {
        status: 'healthy',
        modelsAvailable: response.data?.data?.length || 0,
      };
    } catch (error) {
      logger.error('OpenRouter health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
}

export const openRouterClient = new OpenRouterClient();
