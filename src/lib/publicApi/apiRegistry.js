import { logger } from '../logger.js';

class APIRegistry {
  constructor() {
    this.apis = new Map();
    this.loadConfigurations();
  }

  /**
   * Load API configurations from environment variables
   */
  loadConfigurations() {
    logger.info('Loading API configurations...');
    this._loadFreeAPIs();
    logger.info(`Loaded ${this.apis.size} API configurations`);
  }

  /**
   * Load free public APIs that require no API keys.
   * These are always available without environment variables.
   */
  _loadFreeAPIs() {
    // ─── Animals ────────────────────────────────────────────────
    this.registerAPI({
      name: 'dog-ceo',
      displayName: 'Dog CEO',
      category: 'animals',
      baseURL: 'https://dog.ceo/api',
      auth: { type: 'none' },
      timeout: 10000,
      rateLimit: { maxRequests: 100, windowSeconds: 60 },
      cache: { enabled: true, ttl: 300 },
      retry: { enabled: true, maxAttempts: 3, backoffMs: 1000 },
      health: { enabled: true, endpoint: '/breeds/list/all', intervalSeconds: 300 },
      metadata: {
        description: 'Free, open-source API with 20,000+ dog images across 120+ breeds',
        documentation: 'https://dog.ceo/dog-api/documentation/',
        version: '1.0'
      },
      endpoints: [
        { method: 'GET', path: '/breeds/image/random', description: 'Random dog image' },
        { method: 'GET', path: '/breeds/list/all', description: 'List all breeds and sub-breeds' },
        { method: 'GET', path: '/breed/husky/images/random/3', description: '3 random husky images' },
      ]
    });

    this.registerAPI({
      name: 'cat-facts',
      displayName: 'Cat Facts',
      category: 'animals',
      baseURL: 'https://catfact.ninja',
      auth: { type: 'none' },
      timeout: 10000,
      rateLimit: { maxRequests: 100, windowSeconds: 60 },
      cache: { enabled: true, ttl: 600 },
      retry: { enabled: true, maxAttempts: 3, backoffMs: 1000 },
      health: { enabled: true, endpoint: '/fact', intervalSeconds: 300 },
      metadata: {
        description: 'Paginated collection of cat facts and cat breeds',
        documentation: 'https://catfact.ninja/',
        version: '1.0'
      },
      endpoints: [
        { method: 'GET', path: '/fact', description: 'Random cat fact' },
        { method: 'GET', path: '/facts?limit=3', description: 'Paginated cat facts' },
        { method: 'GET', path: '/breeds?limit=3', description: 'Paginated cat breeds' },
      ]
    });

    // ─── Books ──────────────────────────────────────────────────
    this.registerAPI({
      name: 'poetrydb',
      displayName: 'PoetryDB',
      category: 'books',
      baseURL: 'https://poetrydb.org',
      auth: { type: 'none' },
      timeout: 10000,
      rateLimit: { maxRequests: 100, windowSeconds: 60 },
      cache: { enabled: true, ttl: 3600 },
      retry: { enabled: true, maxAttempts: 3, backoffMs: 1000 },
      health: { enabled: true, endpoint: '/random', intervalSeconds: 300 },
      metadata: {
        description: 'Full-text poetry API — search by author, title, and lines',
        documentation: 'https://github.com/thundercomb/poetrydb#readme',
        version: '1.0'
      },
      endpoints: [
        { method: 'GET', path: '/random', description: 'Random poem' },
        { method: 'GET', path: '/author/Shakespeare', description: 'Poems by Shakespeare' },
        { method: 'GET', path: '/title/Ozymandias', description: 'Search by title' },
      ]
    });

    this.registerAPI({
      name: 'gutendex',
      displayName: 'Gutendex',
      category: 'books',
      baseURL: 'https://gutendex.com',
      auth: { type: 'none' },
      timeout: 15000,
      rateLimit: { maxRequests: 100, windowSeconds: 60 },
      cache: { enabled: true, ttl: 3600 },
      retry: { enabled: true, maxAttempts: 3, backoffMs: 1000 },
      health: { enabled: true, endpoint: '/books?search=dickens', intervalSeconds: 300 },
      metadata: {
        description: 'Web API for Project Gutenberg — search 70,000+ free eBooks',
        documentation: 'https://gutendex.com/',
        version: '1.0'
      },
      endpoints: [
        { method: 'GET', path: '/books?search=dickens', description: 'Search books by author' },
        { method: 'GET', path: '/books/84', description: 'Get book by ID (Frankenstein)' },
        { method: 'GET', path: '/books?topic=science%20fiction&languages=en', description: 'Search by topic' },
      ]
    });

    // ─── Science ────────────────────────────────────────────────
    this.registerAPI({
      name: 'nasa-apod',
      displayName: 'NASA APOD',
      category: 'science',
      baseURL: 'https://api.nasa.gov',
      auth: {
        type: 'query',
        key: process.env.NASA_API_KEY || 'DEMO_KEY',
        queryParam: 'api_key'
      },
      timeout: 10000,
      rateLimit: { maxRequests: 30, windowSeconds: 3600 },
      cache: { enabled: true, ttl: 3600 },
      retry: { enabled: true, maxAttempts: 3, backoffMs: 1000 },
      health: { enabled: true, endpoint: '/planetary/apod', intervalSeconds: 300 },
      metadata: {
        description: 'Astronomy Picture of the Day — daily universe images with explanations',
        documentation: 'https://api.nasa.gov/#apod',
        version: '1.0'
      },
      endpoints: [
        { method: 'GET', path: '/planetary/apod', description: "Today's APOD" },
        { method: 'GET', path: '/planetary/apod?count=3', description: '3 random APODs' },
        { method: 'GET', path: '/planetary/apod?date=2024-01-01', description: 'APOD for specific date' },
      ]
    });

    this.registerAPI({
      name: 'numbers-api',
      displayName: 'Numbers API',
      category: 'science',
      baseURL: 'http://numbersapi.com',
      auth: { type: 'none' },
      timeout: 10000,
      rateLimit: { maxRequests: 100, windowSeconds: 60 },
      cache: { enabled: true, ttl: 600 },
      retry: { enabled: true, maxAttempts: 3, backoffMs: 1000 },
      health: { enabled: true, endpoint: '/42/trivia', intervalSeconds: 300 },
      metadata: {
        description: 'Interesting facts about numbers — trivia, math, date, and year facts',
        documentation: 'http://numbersapi.com/#api',
        version: '1.0'
      },
      endpoints: [
        { method: 'GET', path: '/42/trivia?json', description: 'Trivia about number 42' },
        { method: 'GET', path: '/random/math?json', description: 'Random math fact' },
        { method: 'GET', path: '/2/21/date?json', description: 'Fact about February 21st' },
      ]
    });
  }

  /**
   * Register a new API configuration
   * @param {Object} config - API configuration object
   * @returns {boolean} - Success status
   */
  registerAPI(config) {
    try {
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        logger.error(`Invalid API configuration for ${config.name}:`, validation.errors);
        return false;
      }

      this.apis.set(config.name, config);
      logger.info(`Registered API: ${config.name}`);
      return true;
    } catch (error) {
      logger.error(`Error registering API ${config.name}:`, error);
      return false;
    }
  }

  /**
   * Get configuration for a specific API
   * @param {string} apiName - Name of the API
   * @returns {Object|null} - API configuration or null
   */
  getConfig(apiName) {
    return this.apis.get(apiName) || null;
  }

  /**
   * Update existing API configuration
   * @param {string} apiName - Name of the API
   * @param {Object} updates - Partial configuration updates
   * @returns {boolean} - Success status
   */
  updateConfig(apiName, updates) {
    try {
      const existing = this.apis.get(apiName);
      if (!existing) {
        logger.error(`API ${apiName} not found`);
        return false;
      }

      const updated = { ...existing, ...updates };
      const validation = this.validateConfig(updated);
      if (!validation.valid) {
        logger.error(`Invalid configuration update for ${apiName}:`, validation.errors);
        return false;
      }

      this.apis.set(apiName, updated);
      logger.info(`Updated API configuration: ${apiName}`);
      return true;
    } catch (error) {
      logger.error(`Error updating API ${apiName}:`, error);
      return false;
    }
  }

  /**
   * Get all APIs by category
   * @param {string} category - Category name
   * @returns {Array} - Array of API configurations
   */
  getAPIsByCategory(category) {
    return Array.from(this.apis.values()).filter(api => api.category === category);
  }

  /**
   * Get all registered APIs
   * @returns {Array} - Array of all API configurations
   */
  getAllAPIs() {
    return Array.from(this.apis.values());
  }

  /**
   * Validate API configuration
   * @param {Object} config - API configuration
   * @returns {Object} - Validation result with valid flag and errors array
   */
  validateConfig(config) {
    const errors = [];

    // Required fields
    if (!config.name) errors.push('name is required');
    if (!config.displayName) errors.push('displayName is required');
    if (!config.category) errors.push('category is required');
    if (!config.baseURL) errors.push('baseURL is required');
    if (!config.auth) errors.push('auth is required');
    if (!config.timeout) errors.push('timeout is required');
    if (!config.rateLimit) errors.push('rateLimit is required');

    // Validate baseURL protocol (allow HTTP for APIs like numbersapi.com)
    if (config.baseURL && !config.baseURL.startsWith('http://') && !config.baseURL.startsWith('https://')) {
      errors.push('baseURL must use HTTP or HTTPS protocol');
    }

    // Validate category
    const validCategories = ['animals', 'books', 'science', 'utility'];
    if (config.category && !validCategories.includes(config.category)) {
      errors.push(`category must be one of: ${validCategories.join(', ')}`);
    }

    // Validate auth type (includes 'none' for free APIs)
    const validAuthTypes = ['header', 'query', 'bearer', 'basic', 'none'];
    if (config.auth && !validAuthTypes.includes(config.auth.type)) {
      errors.push(`auth.type must be one of: ${validAuthTypes.join(', ')}`);
    }

    // Validate timeout range
    if (config.timeout && (config.timeout < 1000 || config.timeout > 60000)) {
      errors.push('timeout must be between 1000 and 60000 milliseconds');
    }

    // Validate rate limit
    if (config.rateLimit) {
      if (!config.rateLimit.maxRequests || config.rateLimit.maxRequests <= 0) {
        errors.push('rateLimit.maxRequests must be a positive integer');
      }
      if (!config.rateLimit.windowSeconds || config.rateLimit.windowSeconds <= 0) {
        errors.push('rateLimit.windowSeconds must be a positive integer');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Reload configurations without restart
   */
  reloadConfigurations() {
    logger.info('Reloading API configurations...');
    this.apis.clear();
    this.loadConfigurations();
  }
}

// Export singleton instance
const apiRegistry = new APIRegistry();
export default apiRegistry;
