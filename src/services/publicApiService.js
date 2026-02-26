import apiRegistry from '../lib/publicApi/apiRegistry.js';
import WeatherAPIClient from '../lib/publicApi/clients/weatherClient.js';
import APICacheManager from '../lib/publicApi/cacheManager.js';
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
    switch (apiName) {
      case 'openweathermap':
        client = new WeatherAPIClient(config);
        break;
      default:
        throw new Error(`No client implementation for ${apiName}`);
    }

    this.clients.set(apiName, client);
    return client;
  }

  /**
   * Get weather data with caching
   * @param {Object} params - Weather query parameters
   * @returns {Promise<Object>} - Weather data
   */
  async getWeather(params) {
    try {
      const apiName = 'openweathermap';
      const config = apiRegistry.getConfig(apiName);
      
      if (!config) {
        return {
          success: false,
          error: {
            code: 'API_NOT_CONFIGURED',
            message: 'Weather API is not configured. Please add WEATHER_API_KEY to .env file'
          }
        };
      }

      // Generate cache key
      const endpoint = params.city ? 'weather-city' : 'weather-coords';
      const cacheKey = this.cacheManager.generateKey(apiName, endpoint, params);

      // Check cache
      if (config.cache?.enabled) {
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
          logger.info('Returning cached weather data');
          return {
            ...cached,
            metadata: {
              ...cached.metadata,
              cached: true
            }
          };
        }
      }

      // Get client and fetch data
      const client = this.getClient(apiName);
      let response;

      if (params.city) {
        response = await client.getCurrentWeatherByCity(params.city, params.country);
      } else if (params.lat && params.lon) {
        response = await client.getCurrentWeather(params.lat, params.lon);
      } else {
        return {
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Either city or lat/lon coordinates are required'
          }
        };
      }

      // Cache successful response
      if (response.success && config.cache?.enabled) {
        await this.cacheManager.set(cacheKey, response, config.cache.ttl);
      }

      return response;
    } catch (error) {
      logger.error('Error in getWeather:', error);
      return {
        success: false,
        error: {
          code: 'SERVICE_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Get weather forecast with caching
   * @param {Object} params - Forecast query parameters
   * @returns {Promise<Object>} - Forecast data
   */
  async getForecast(params) {
    try {
      const apiName = 'openweathermap';
      const config = apiRegistry.getConfig(apiName);
      
      if (!config) {
        return {
          success: false,
          error: {
            code: 'API_NOT_CONFIGURED',
            message: 'Weather API is not configured'
          }
        };
      }

      const cacheKey = this.cacheManager.generateKey(apiName, 'forecast', params);

      // Check cache
      if (config.cache?.enabled) {
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
          return {
            ...cached,
            metadata: { ...cached.metadata, cached: true }
          };
        }
      }

      // Fetch data
      const client = this.getClient(apiName);
      const response = await client.getForecast(params.lat, params.lon, params.days);

      // Cache successful response
      if (response.success && config.cache?.enabled) {
        await this.cacheManager.set(cacheKey, response, config.cache.ttl);
      }

      return response;
    } catch (error) {
      logger.error('Error in getForecast:', error);
      return {
        success: false,
        error: {
          code: 'SERVICE_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Get list of available APIs
   * @returns {Object} - List of APIs with their status
   */
  getAvailableAPIs() {
    const apis = apiRegistry.getAllAPIs();
    return {
      success: true,
      data: {
        total: apis.length,
        apis: apis.map(api => ({
          name: api.name,
          displayName: api.displayName,
          category: api.category,
          description: api.metadata?.description,
          configured: true
        }))
      }
    };
  }
}

export default new PublicAPIService();
