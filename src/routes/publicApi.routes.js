import express from 'express';
import {
  getCatalog,
  getCatalogDetail,
  getCategories,
  executeTest,
  batchTest,
  customRequest,
  getAPIHealth
} from '../controllers/publicApi.controller.js';

const router = express.Router();



// ─── API Catalog endpoints (new) ───────────────────────────────
// List all APIs with optional ?category= filter
router.get('/catalog', getCatalog);
// List all unique categories
router.get('/catalog/categories', getCategories);
// Get details for a specific API by name
router.get('/catalog/:apiName', getCatalogDetail);

// ─── Test Execution endpoints (new) ────────────────────────────
// Execute a single endpoint test
// Body: { apiName: "dog-ceo", endpointIndex: 0 }
router.post('/test/execute', executeTest);
// Batch test all endpoints for an API
// Body: { apiName: "poetrydb" }
router.post('/test/batch', batchTest);
// Execute a custom/freeform request (Postman-like)
// Body: { method: "GET", url: "https://catfact.ninja/fact", headers: {}, body: null }
router.post('/test/custom', customRequest);

// ─── Management endpoints ──────────────────────────────────────
router.get('/health', getAPIHealth);

export default router;
