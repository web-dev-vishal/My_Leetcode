import apiRegistry from '../../src/lib/publicApi/apiRegistry.js';

describe('API Registry', () => {
  describe('Configuration Validation', () => {
    test('should validate correct configuration', () => {
      const config = {
        name: 'test-api',
        displayName: 'Test API',
        category: 'weather',
        baseURL: 'https://api.test.com',
        auth: {
          type: 'header',
          key: 'test-key',
          headerName: 'Authorization'
        },
        timeout: 10000,
        rateLimit: {
          maxRequests: 60,
          windowSeconds: 60
        }
      };

      const result = apiRegistry.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject HTTP URLs', () => {
      const config = {
        name: 'test-api',
        displayName: 'Test API',
        category: 'weather',
        baseURL: 'http://api.test.com',  // HTTP not HTTPS
        auth: { type: 'header', key: 'test' },
        timeout: 10000,
        rateLimit: { maxRequests: 60, windowSeconds: 60 }
      };

      const result = apiRegistry.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('baseURL must use HTTPS protocol');
    });

    test('should reject invalid timeout', () => {
      const config = {
        name: 'test-api',
        displayName: 'Test API',
        category: 'weather',
        baseURL: 'https://api.test.com',
        auth: { type: 'header', key: 'test' },
        timeout: 100,  // Too low
        rateLimit: { maxRequests: 60, windowSeconds: 60 }
      };

      const result = apiRegistry.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('timeout must be between 1000 and 60000 milliseconds');
    });
  });

  describe('API Registration', () => {
    test('should get all registered APIs', () => {
      const apis = apiRegistry.getAllAPIs();
      expect(Array.isArray(apis)).toBe(true);
    });

    test('should filter APIs by category', () => {
      const weatherAPIs = apiRegistry.getAPIsByCategory('weather');
      expect(Array.isArray(weatherAPIs)).toBe(true);
      weatherAPIs.forEach(api => {
        expect(api.category).toBe('weather');
      });
    });
  });
});
