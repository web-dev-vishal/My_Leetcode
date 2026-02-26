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
    try {
      // Weather API Configuration
      if (process.env.WEATHER_API_KEY) {
        this.registerAPI({
          name: 'openweathermap',
          displayName: 'OpenWeatherMap',
          category: 'weather',
          baseURL: process.env.WEATHER_API_BASE_URL || 'https://api.openweathermap.org/data/2.5',
          auth: {
            type: 'query',
            key: process.env.WEATHER_API_KEY,
            queryParam: 'appid'
          },
          timeout: parseInt(process.env.WEATHER_API_TIMEOUT, 10) || 10000,
          rateLimit: {
            maxRequests: parseInt(process.env.WEATHER_API_RATE_LIMIT_MAX, 10) || 60,
            windowSeconds: parseInt(process.env.WEATHER_API_RATE_LIMIT_WINDOW, 10) || 60
          },
          cache: {
            enabled: true,
            ttl: parseInt(process.env.WEATHER_API_CACHE_TTL, 10) || 600
          },
          retry: {
            enabled: true,
            maxAttempts: 3,
            backoffMs: 1000
          },
          health: {
            enabled: true,
            endpoint: '/weather',
            intervalSeconds: 300
          },
          metadata: {
            description: 'Weather data and forecasts',
            documentation: 'https://openweathermap.org/api',
            version: '2.5'
          }
        });
      }

      // Finance API Configuration
      if (process.env.FINANCE_API_KEY) {
        this.registerAPI({
          name: 'alphavantage',
          displayName: 'Alpha Vantage',
          category: 'finance',
          baseURL: process.env.FINANCE_API_BASE_URL || 'https://www.alphavantage.co/query',
          auth: {
            type: 'query',
            key: process.env.FINANCE_API_KEY,
            queryParam: 'apikey'
          },
          timeout: parseInt(process.env.FINANCE_API_TIMEOUT, 10) || 10000,
          rateLimit: {
            maxRequests: parseInt(process.env.FINANCE_API_RATE_LIMIT_MAX, 10) || 5,
            windowSeconds: parseInt(process.env.FINANCE_API_RATE_LIMIT_WINDOW, 10) || 60
          },
          cache: {
            enabled: true,
            ttl: parseInt(process.env.FINANCE_API_CACHE_TTL, 10) || 60
          },
          retry: {
            enabled: true,
            maxAttempts: 3,
            backoffMs: 1000
          },
          health: {
            enabled: true,
            endpoint: '',
            intervalSeconds: 300
          },
          metadata: {
            description: 'Stock market data and financial information',
            documentation: 'https://www.alphavantage.co/documentation/',
            version: '1.0'
          }
        });
      }

      // News API Configuration
      if (process.env.NEWS_API_KEY) {
        this.registerAPI({
          name: 'newsapi',
          displayName: 'NewsAPI',
          category: 'news',
          baseURL: process.env.NEWS_API_BASE_URL || 'https://newsapi.org/v2',
          auth: {
            type: 'header',
            key: process.env.NEWS_API_KEY,
            headerName: 'X-Api-Key'
          },
          timeout: parseInt(process.env.NEWS_API_TIMEOUT, 10) || 10000,
          rateLimit: {
            maxRequests: parseInt(process.env.NEWS_API_RATE_LIMIT_MAX, 10) || 100,
            windowSeconds: parseInt(process.env.NEWS_API_RATE_LIMIT_WINDOW, 10) || 86400
          },
          cache: {
            enabled: true,
            ttl: parseInt(process.env.NEWS_API_CACHE_TTL, 10) || 900
          },
          retry: {
            enabled: true,
            maxAttempts: 3,
            backoffMs: 1000
          },
          health: {
            enabled: true,
            endpoint: '/top-headlines',
            intervalSeconds: 300
          },
          metadata: {
            description: 'News headlines and articles',
            documentation: 'https://newsapi.org/docs',
            version: '2'
          }
        });
      }

      logger.info(`API Registry loaded ${this.apis.size} API configurations`);
    } catch (error) {
      logger.error('Error loading API configurations:', error);
    }
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

    // Validate baseURL uses HTTPS
    if (config.baseURL && !config.baseURL.startsWith('https://')) {
      errors.push('baseURL must use HTTPS protocol');
    }

    // Validate category
    const validCategories = ['weather', 'finance', 'news', 'sports', 'entertainment', 'utility'];
    if (config.category && !validCategories.includes(config.category)) {
      errors.push(`category must be one of: ${validCategories.join(', ')}`);
    }

    // Validate auth type
    const validAuthTypes = ['header', 'query', 'bearer', 'basic'];
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
