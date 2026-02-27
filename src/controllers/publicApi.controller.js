import publicApiService from '../services/publicApiService.js';
import { logger } from '../lib/logger.js';

// ─── Existing Weather Endpoints ────────────────────────────────

// ─── API Explorer Endpoints (new) ──────────────────────────────

/**
 * Get list of available APIs (with optional category filter)
 * GET /api/v1/public-apis/catalog
 * Query: ?category=animals
 */
export const getCatalog = async (req, res) => {
  try {
    const { category } = req.query;
    const result = publicApiService.getAvailableAPIs(category);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getCatalog controller:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    });
  }
};

/**
 * Get details for a single API
 * GET /api/v1/public-apis/catalog/:apiName
 */
export const getCatalogDetail = async (req, res) => {
  try {
    const { apiName } = req.params;
    const result = publicApiService.getAPIDetail(apiName);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Error in getCatalogDetail controller:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    });
  }
};

/**
 * Get all unique categories
 * GET /api/v1/public-apis/catalog/categories
 */
export const getCategories = async (req, res) => {
  try {
    const result = publicApiService.getCategories();
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getCategories controller:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    });
  }
};

/**
 * Execute a single endpoint test
 * POST /api/v1/public-apis/test/execute
 * Body: { apiName: string, endpointIndex: number }
 */
export const executeTest = async (req, res) => {
  try {
    const { apiName, endpointIndex } = req.body;

    if (!apiName || endpointIndex === undefined || endpointIndex === null) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETERS', message: 'apiName and endpointIndex are required' }
      });
    }

    const result = await publicApiService.executeEndpointTest(apiName, endpointIndex);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Error in executeTest controller:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    });
  }
};

/**
 * Batch test all endpoints for an API
 * POST /api/v1/public-apis/test/batch
 * Body: { apiName: string }
 */
export const batchTest = async (req, res) => {
  try {
    const { apiName } = req.body;

    if (!apiName) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETERS', message: 'apiName is required' }
      });
    }

    const result = await publicApiService.batchTestAPI(apiName);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Error in batchTest controller:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    });
  }
};

/**
 * Execute a custom/freeform HTTP request
 * POST /api/v1/public-apis/test/custom
 * Body: { method: string, url: string, headers?: object, body?: any }
 */
export const customRequest = async (req, res) => {
  try {
    const { method, url, headers, body } = req.body;

    if (!method || !url) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETERS', message: 'method and url are required' }
      });
    }

    const result = await publicApiService.executeCustomRequest({ method, url, headers, body });
    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Error in customRequest controller:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    });
  }
};

/**
 * API health check
 * GET /api/v1/public-apis/health
 */
export const getAPIHealth = async (req, res) => {
  try {
    const apis = publicApiService.getAvailableAPIs();
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Public API integration is operational',
        totalAPIs: apis.data?.total || 0
      }
    });
  } catch (error) {
    logger.error('Error in getAPIHealth controller:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Health check failed' }
    });
  }
};

// Keep backward compat export
export const getAPIRegistry = getCatalog;
