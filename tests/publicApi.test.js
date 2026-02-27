// ──────────────────────────────────────────────────────────────
// tests/publicApi.test.js — Tests for API Explorer functionality
// Tests the catalog, test execution, and live endpoint validation.
// ──────────────────────────────────────────────────────────────
import axios from 'axios';

// Direct imports for unit testing without starting the full server
import apiRegistry from '../src/lib/publicApi/apiRegistry.js';
import publicApiService from '../src/services/publicApiService.js';

describe('API Registry', () => {
    it('should have at least 6 free APIs registered', () => {
        const apis = apiRegistry.getAllAPIs();
        const freeApis = apis.filter(a => a.auth?.type === 'none' || a.name === 'nasa-apod');
        expect(freeApis.length).toBeGreaterThanOrEqual(6);
    });

    it('should include animals, books, science categories', () => {
        const apis = apiRegistry.getAllAPIs();
        const categories = [...new Set(apis.map(a => a.category))];
        expect(categories).toContain('animals');
        expect(categories).toContain('books');
        expect(categories).toContain('science');
    });

    it('each free API should have 3+ endpoints', () => {
        const freeNames = ['dog-ceo', 'cat-facts', 'poetrydb', 'gutendex', 'nasa-apod', 'numbers-api'];
        freeNames.forEach(name => {
            const config = apiRegistry.getConfig(name);
            expect(config).not.toBeNull();
            expect(config.endpoints.length).toBeGreaterThanOrEqual(3);
        });
    });

    it('should get API config by name', () => {
        const config = apiRegistry.getConfig('dog-ceo');
        expect(config).not.toBeNull();
        expect(config.displayName).toBe('Dog CEO');
        expect(config.category).toBe('animals');
    });

    it('should return null for unknown API', () => {
        const config = apiRegistry.getConfig('nonexistent');
        expect(config).toBeNull();
    });

    it('should filter APIs by category', () => {
        const animals = apiRegistry.getAPIsByCategory('animals');
        expect(animals.length).toBe(2);
        animals.forEach(a => expect(a.category).toBe('animals'));
    });
});

describe('PublicAPIService — Catalog', () => {
    it('getAvailableAPIs should return all APIs', () => {
        const result = publicApiService.getAvailableAPIs();
        expect(result.success).toBe(true);
        expect(result.data.total).toBeGreaterThanOrEqual(6);
    });

    it('getAvailableAPIs should filter by category', () => {
        const result = publicApiService.getAvailableAPIs('books');
        expect(result.success).toBe(true);
        expect(result.data.total).toBe(2);
        result.data.apis.forEach(a => expect(a.category).toBe('books'));
    });

    it('getAPIDetail should return details for known API', () => {
        const result = publicApiService.getAPIDetail('poetrydb');
        expect(result.success).toBe(true);
        expect(result.data.name).toBe('poetrydb');
        expect(result.data.endpoints.length).toBeGreaterThanOrEqual(3);
    });

    it('getAPIDetail should return error for unknown API', () => {
        const result = publicApiService.getAPIDetail('nonexistent');
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('NOT_FOUND');
    });

    it('getCategories should return sorted list', () => {
        const result = publicApiService.getCategories();
        expect(result.success).toBe(true);
        expect(result.data.categories).toContain('animals');
        expect(result.data.categories).toContain('books');
        expect(result.data.categories).toContain('science');
    });
});

describe('PublicAPIService — Live Endpoint Tests', () => {
    // These tests hit real APIs and require internet
    jest.setTimeout(30000);

    it('should execute dog-ceo random image endpoint', async () => {
        const result = await publicApiService.executeEndpointTest('dog-ceo', 0);
        expect(result.success).toBe(true);
        expect(result.test.passed).toBe(true);
        expect(result.test.status).toBe(200);
        expect(result.test.duration_ms).toBeGreaterThan(0);
    });

    it('should execute cat-facts fact endpoint', async () => {
        const result = await publicApiService.executeEndpointTest('cat-facts', 0);
        expect(result.success).toBe(true);
        expect(result.test.passed).toBe(true);
        expect(result.test.response).toHaveProperty('fact');
    });

    it('should execute poetrydb random endpoint', async () => {
        const result = await publicApiService.executeEndpointTest('poetrydb', 0);
        expect(result.success).toBe(true);
        expect(result.test.passed).toBe(true);
    });

    it('should execute gutendex search endpoint', async () => {
        const result = await publicApiService.executeEndpointTest('gutendex', 0);
        expect(result.success).toBe(true);
        expect(result.test.passed).toBe(true);
    });

    it('should execute numbers-api trivia endpoint', async () => {
        const result = await publicApiService.executeEndpointTest('numbers-api', 0);
        expect(result.success).toBe(true);
        expect(result.test.passed).toBe(true);
    });

    it('should batch test dog-ceo (3 endpoints)', async () => {
        const result = await publicApiService.batchTestAPI('dog-ceo');
        expect(result.success).toBe(true);
        expect(result.summary.total).toBe(3);
        expect(result.summary.passed).toBeGreaterThanOrEqual(2); // Allow 1 flaky
    });

    it('should execute a custom request', async () => {
        const result = await publicApiService.executeCustomRequest({
            method: 'GET',
            url: 'https://catfact.ninja/fact'
        });
        expect(result.success).toBe(true);
        expect(result.test.status).toBe(200);
    });

    it('should handle invalid custom URL', async () => {
        const result = await publicApiService.executeCustomRequest({
            method: 'GET',
            url: 'not-a-url'
        });
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('INVALID_URL');
    });

    it('should return error for bad endpointIndex', async () => {
        const result = await publicApiService.executeEndpointTest('dog-ceo', 99);
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('INVALID_ENDPOINT');
    });
});
