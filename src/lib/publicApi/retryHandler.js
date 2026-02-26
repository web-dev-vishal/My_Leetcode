import { logger } from '../logger.js';

class RetryHandler {
  constructor() {
    this.retryableStatuses = [429, 500, 502, 503, 504];
    this.nonRetryableStatuses = [400, 401, 403, 404];
  }

  /**
   * Execute function with retry logic
   * @param {Function} fn - Function to execute
   * @param {Object} options - Retry options
   * @returns {Promise<any>} - Function result
   */
  async executeWithRetry(fn, options = {}) {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      retryableStatuses = this.retryableStatuses,
      onRetry = null
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!this.isRetryable(error, retryableStatuses)) {
          logger.warn('Non-retryable error encountered', {
            status: error.response?.status,
            message: error.message
          });
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          logger.error(`Max retry attempts (${maxAttempts}) reached`, {
            error: error.message
          });
          throw error;
        }

        // Calculate backoff delay
        const delay = this.calculateBackoff(attempt, baseDelay, maxDelay);
        
        logger.info(`Retrying request (attempt ${attempt + 1}/${maxAttempts}) after ${delay}ms`, {
          error: error.message,
          status: error.response?.status
        });

        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, delay, error);
        }

        // Wait before retrying
        await this._sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error object
   * @param {Array} retryableStatuses - Array of retryable status codes
   * @returns {boolean} - Whether error is retryable
   */
  isRetryable(error) {
    // Network errors are retryable
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      return true;
    }

    // Check HTTP status code
    if (error.response) {
      const status = error.response.status;
      
      // Non-retryable statuses (auth errors, bad requests)
      if (this.nonRetryableStatuses.includes(status)) {
        return false;
      }
      
      // Retryable statuses (rate limits, server errors)
      return this.retryableStatuses.includes(status);
    }

    // Unknown errors are not retryable
    return false;
  }

  /**
   * Calculate backoff delay with exponential backoff
   * @param {number} attempt - Current attempt number (0-indexed)
   * @param {number} baseDelay - Base delay in milliseconds
   * @param {number} maxDelay - Maximum delay in milliseconds
   * @returns {number} - Delay in milliseconds
   */
  calculateBackoff(attempt, baseDelay = 1000, maxDelay = 30000) {
    // Exponential backoff: baseDelay * 2^attempt
    // For attempt 0: 1000ms, attempt 1: 2000ms, attempt 2: 4000ms
    const delay = baseDelay * Math.pow(2, attempt);
    return Math.min(delay, maxDelay);
  }

  /**
   * Get retry configuration for API
   * @param {string} apiName - API name
   * @returns {Object} - Retry configuration
   */
  getRetryConfig(apiName) {
    // Default retry configuration
    return {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      retryableStatuses: this.retryableStatuses
    };
  }

  /**
   * Sleep for specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default RetryHandler;
