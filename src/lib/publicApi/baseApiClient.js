import axios from 'axios';
import { logger } from '../logger.js';

class BaseAPIClient {
  constructor(config) {
    this.config = config;
    this.axiosInstance = null;
    this.healthStatus = {
      status: 'unknown',
      lastCheck: null,
      responseTime: null
    };
    this.initialize();
  }

  /**
   * Initialize axios instance with configuration
   */
  initialize() {
    try {
      const axiosConfig = {
        baseURL: this.config.baseURL,
        timeout: this.config.timeout || 10000,
        headers: {}
      };

      // Add authentication headers based on auth type
      if (this.config.auth) {
        switch (this.config.auth.type) {
          case 'header':
            axiosConfig.headers[this.config.auth.headerName || 'Authorization'] = this.config.auth.key;
            break;
          case 'bearer':
            axiosConfig.headers['Authorization'] = `Bearer ${this.config.auth.key}`;
            break;
          case 'basic':
            const credentials = Buffer.from(this.config.auth.key).toString('base64');
            axiosConfig.headers['Authorization'] = `Basic ${credentials}`;
            break;
          // 'query' type is handled in request methods
        }
      }

      this.axiosInstance = axios.create(axiosConfig);
      logger.info(`Initialized API client for ${this.config.name}`);
    } catch (error) {
      logger.error(`Error initializing API client for ${this.config.name}:`, error);
      throw error;
    }
  }

  /**
   * Execute GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Standardized API response
   */
  async get(endpoint, params = {}, options = {}) {
    return this.request({
      method: 'GET',
      url: endpoint,
      params: this._addAuthParams(params),
      ...options
    });
  }

  /**
   * Execute POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Standardized API response
   */
  async post(endpoint, data = {}, options = {}) {
    return this.request({
      method: 'POST',
      url: endpoint,
      data,
      ...options
    });
  }

  /**
   * Execute PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Standardized API response
   */
  async put(endpoint, data = {}, options = {}) {
    return this.request({
      method: 'PUT',
      url: endpoint,
      data,
      ...options
    });
  }

  /**
   * Execute DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Standardized API response
   */
  async delete(endpoint, options = {}) {
    return this.request({
      method: 'DELETE',
      url: endpoint,
      ...options
    });
  }

  /**
   * Execute request with full control
   * @param {Object} config - Axios request configuration
   * @returns {Promise<Object>} - Standardized API response
   */
  async request(config) {
    const startTime = Date.now();
    
    try {
      const response = await this.axiosInstance.request(config);
      const responseTime = Date.now() - startTime;

      logger.info(`API request successful: ${this.config.name} ${config.method} ${config.url}`, {
        responseTime,
        status: response.status
      });

      return this._formatResponse(response, responseTime, false);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error(`API request failed: ${this.config.name} ${config.method} ${config.url}`, {
        error: error.message,
        responseTime,
        status: error.response?.status
      });

      return this._formatError(error, responseTime);
    }
  }

  /**
   * Add authentication parameters for query-based auth
   * @param {Object} params - Original parameters
   * @returns {Object} - Parameters with auth added
   */
  _addAuthParams(params) {
    if (this.config.auth?.type === 'query') {
      return {
        ...params,
        [this.config.auth.queryParam]: this.config.auth.key
      };
    }
    return params;
  }

  /**
   * Format successful response to standard format
   * @param {Object} response - Axios response
   * @param {number} responseTime - Response time in ms
   * @param {boolean} cached - Whether response is from cache
   * @returns {Object} - Standardized response
   */
  _formatResponse(response, responseTime, cached = false) {
    return {
      success: true,
      data: this.transformResponse(response.data),
      metadata: {
        source: this.config.name,
        timestamp: new Date().toISOString(),
        cached,
        responseTime
      }
    };
  }

  /**
   * Format error response to standard format
   * @param {Error} error - Error object
   * @param {number} responseTime - Response time in ms
   * @returns {Object} - Standardized error response
   */
  _formatError(error, responseTime) {
    const status = error.response?.status || 500;
    const errorCode = this._getErrorCode(error);

    return {
      success: false,
      data: null,
      metadata: {
        source: this.config.name,
        timestamp: new Date().toISOString(),
        cached: false,
        responseTime
      },
      error: {
        code: errorCode,
        message: error.message || 'An error occurred',
        status,
        details: error.response?.data
      }
    };
  }

  /**
   * Get error code from error object
   * @param {Error} error - Error object
   * @returns {string} - Error code
   */
  _getErrorCode(error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'TIMEOUT';
    }
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) return 'AUTHENTICATION_FAILED';
      if (status === 429) return 'RATE_LIMIT_EXCEEDED';
      if (status === 404) return 'NOT_FOUND';
      if (status >= 500) return 'EXTERNAL_API_ERROR';
    }
    return 'REQUEST_FAILED';
  }

  /**
   * Transform raw response to standard format
   * Override this method in subclasses for API-specific transformation
   * @param {any} data - Raw API response data
   * @returns {any} - Transformed data
   */
  transformResponse(data) {
    return data;
  }

  /**
   * Get client health status
   * @returns {Object} - Health status
   */
  getHealth() {
    return this.healthStatus;
  }
}

export default BaseAPIClient;
