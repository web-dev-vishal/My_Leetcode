import publicApiService from '../services/publicApiService.js';
import { logger } from '../lib/logger.js';

/**
 * Get current weather
 * GET /api/public-apis/weather/current
 * Query params: city, country OR lat, lon
 */
export const getCurrentWeather = async (req, res) => {
  try {
    const { city, country, lat, lon } = req.query;

    const result = await publicApiService.getWeather({
      city,
      country,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined
    });

    const statusCode = result.success ? 200 : (result.error?.status || 500);
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Error in getCurrentWeather controller:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
};

/**
 * Get weather forecast
 * GET /api/public-apis/weather/forecast
 * Query params: lat, lon, days (optional)
 */
export const getWeatherForecast = async (req, res) => {
  try {
    const { lat, lon, days } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'lat and lon parameters are required'
        }
      });
    }

    const result = await publicApiService.getForecast({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      days: days ? parseInt(days, 10) : 5
    });

    const statusCode = result.success ? 200 : (result.error?.status || 500);
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Error in getWeatherForecast controller:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
};

/**
 * Get list of available APIs
 * GET /api/public-apis/registry
 */
export const getAPIRegistry = async (req, res) => {
  try {
    const result = publicApiService.getAvailableAPIs();
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getAPIRegistry controller:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
};

/**
 * Health check for public APIs
 * GET /api/public-apis/health
 */
export const getAPIHealth = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Public API integration is operational'
      }
    });
  } catch (error) {
    logger.error('Error in getAPIHealth controller:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Health check failed'
      }
    });
  }
};
