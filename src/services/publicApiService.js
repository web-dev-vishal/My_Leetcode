import apiRegistry from '../lib/publicApi/apiRegistry.js';
import APICacheManager from '../lib/publicApi/cacheManager.js';
import BaseAPIClient from '../lib/publicApi/baseApiClient.js';
import axios from 'axios';
import { logger } from '../lib/logger.js';

class PublicAPIService {
  constructor() {
    this.cacheManager = new APICacheManager();
    this.clients = new Map();
  }

  /**
   * Get or create API client
   * @param {string} apiName - API name
   * @returns {Object} - API client instance
   */
  getClient(apiName) {
    if (this.clients.has(apiName)) {
      return this.clients.get(apiName);
    }

    const config = apiRegistry.getConfig(apiName);
    if (!config) {
      throw new Error(`API ${apiName} not configured`);
    }

    let client;
    // For free/generic APIs, use BaseAPIClient directly
    client = new BaseAPIClient(config);

    this.clients.set(apiName, client);
    return client;
  }

  // ─── API Explorer Methods ──────────────────────────────

  /**
   * Get list of available APIs with optional category filter
   * @param {string} [category] - Optional category filter
   * @returns {Object} - List of APIs
   */
  getAvailableAPIs(category) {
    let apis = apiRegistry.getAllAPIs();

    if (category) {
      apis = apis.filter(api => api.category === category.toLowerCase());
    }

    return {
      success: true,
      data: {
        total: apis.length,
        apis: apis.map(api => ({
          name: api.name,
          displayName: api.displayName,
          category: api.category,
          baseURL: api.baseURL,
          description: api.metadata?.description,
          documentation: api.metadata?.documentation,
          auth: api.auth?.type || 'none',
          rateLimit: api.rateLimit,
          endpoints: api.endpoints || [],
          configured: true
        }))
      }
    };
  }

  /**
   * Get details for a single API by name
   * @param {string} apiName - API name
   * @returns {Object} - API detail
   */
  getAPIDetail(apiName) {
    const config = apiRegistry.getConfig(apiName);
    if (!config) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: `API "${apiName}" not found in registry` }
      };
    }

    return {
      success: true,
      data: {
        name: config.name,
        displayName: config.displayName,
        category: config.category,
        baseURL: config.baseURL,
        description: config.metadata?.description,
        documentation: config.metadata?.documentation,
        auth: config.auth?.type || 'none',
        rateLimit: config.rateLimit,
        cache: config.cache,
        endpoints: config.endpoints || [],
        configured: true
      }
    };
  }

  /**
   * Get all unique categories
   * @returns {Object} - List of categories
   */
  getCategories() {
    const apis = apiRegistry.getAllAPIs();
    const categories = [...new Set(apis.map(api => api.category))].sort();
    return {
      success: true,
      data: { categories, total: categories.length }
    };
  }

  /**
   * Execute a single API endpoint test
   * @param {string} apiName - API name
   * @param {number} endpointIndex - Index of endpoint in the endpoints array
   * @returns {Promise<Object>} - Test result
   */
  async executeEndpointTest(apiName, endpointIndex) {
    try {
      const config = apiRegistry.getConfig(apiName);
      if (!config) {
        return { success: false, error: { code: 'NOT_FOUND', message: `API "${apiName}" not found` } };
      }

      if (!config.endpoints || !config.endpoints[endpointIndex]) {
        return {
          success: false,
          error: {
            code: 'INVALID_ENDPOINT',
            message: `Endpoint index ${endpointIndex} out of range (0-${(config.endpoints?.length || 1) - 1})`
          }
        };
      }

      const endpoint = config.endpoints[endpointIndex];
      let url = `${config.baseURL}${endpoint.path}`;

      // Add auth query params if needed
      if (config.auth?.type === 'query') {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}${config.auth.queryParam}=${config.auth.key}`;
      }

      const startTime = Date.now();
      const response = await axios({
        method: endpoint.method || 'GET',
        url,
        timeout: config.timeout || 10000,
        validateStatus: () => true, // Don't throw on non-2xx
        headers: {
          'Accept': 'application/json',
          // Add header-based auth if needed
          ...(config.auth?.type === 'header' ? { [config.auth.headerName]: config.auth.key } : {}),
          ...(config.auth?.type === 'bearer' ? { 'Authorization': `Bearer ${config.auth.key}` } : {}),
        }
      });
      const duration_ms = Date.now() - startTime;

      const passed = response.status >= 200 && response.status < 400;

      return {
        success: true,
        test: {
          api: config.displayName,
          apiName: config.name,
          endpoint: `${endpoint.method || 'GET'} ${endpoint.path}`,
          description: endpoint.description,
          passed,
          status: response.status,
          statusText: response.statusText,
          duration_ms,
          response: response.data,
          rateLimit: {
            limit: response.headers['x-ratelimit-limit'] || null,
            remaining: response.headers['x-ratelimit-remaining'] || null,
            reset: response.headers['x-ratelimit-reset'] || null,
          }
        }
      };
    } catch (error) {
      logger.error(`Error executing endpoint test for ${apiName}:`, error);
      return {
        success: false,
        error: { code: 'TEST_FAILED', message: error.message }
      };
    }
  }

  /**
   * Batch test all endpoints for an API
   * @param {string} apiName - API name
   * @returns {Promise<Object>} - Batch results
   */
  async batchTestAPI(apiName) {
    const config = apiRegistry.getConfig(apiName);
    if (!config) {
      return { success: false, error: { code: 'NOT_FOUND', message: `API "${apiName}" not found` } };
    }

    if (!config.endpoints || config.endpoints.length === 0) {
      return { success: false, error: { code: 'NO_ENDPOINTS', message: `API "${apiName}" has no configured endpoints` } };
    }

    const results = [];
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < config.endpoints.length; i++) {
      const result = await this.executeEndpointTest(apiName, i);
      if (result.success && result.test?.passed) {
        passed++;
      } else {
        failed++;
      }
      results.push(result.success ? result.test : { index: i, passed: false, error: result.error });
    }

    return {
      success: true,
      summary: {
        api: config.displayName,
        apiName: config.name,
        total: config.endpoints.length,
        passed,
        failed,
      },
      results,
    };
  }

  /**
   * Execute a custom/freeform HTTP request (Postman-like)
   * @param {Object} params - { method, url, headers, body }
   * @returns {Promise<Object>} - Request result
   */
  async executeCustomRequest({ method, url, headers = {}, body = null }) {
    try {
      // Validate URL
      try { new URL(url); } catch {
        return { success: false, error: { code: 'INVALID_URL', message: 'Invalid URL format' } };
      }

      const startTime = Date.now();
      const response = await axios({
        method: method.toUpperCase(),
        url,
        headers: { 'Accept': 'application/json', ...headers },
        data: body,
        timeout: 15000,
        validateStatus: () => true,
      });
      const duration_ms = Date.now() - startTime;

      return {
        success: true,
        test: {
          method: method.toUpperCase(),
          url,
          status: response.status,
          statusText: response.statusText,
          duration_ms,
          response: response.data,
          responseHeaders: {
            'content-type': response.headers['content-type'],
            'x-ratelimit-limit': response.headers['x-ratelimit-limit'] || null,
            'x-ratelimit-remaining': response.headers['x-ratelimit-remaining'] || null,
          },
        }
      };
    } catch (error) {
      logger.error('Error executing custom request:', error);
      return { success: false, error: { code: 'REQUEST_FAILED', message: error.message } };
    }
  }
}

export default new PublicAPIService();
