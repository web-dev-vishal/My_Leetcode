# Implementation Plan: Public API Integration

## Overview

This implementation plan breaks down the Public API Integration feature into discrete, manageable coding tasks. The system will provide a comprehensive framework for integrating multiple external APIs (weather, finance, news) with robust error handling, caching, rate limiting, health monitoring, and data enrichment capabilities.

The implementation follows a bottom-up approach: building core infrastructure first, then specific API clients, followed by services, controllers, and finally integration and testing.

## Tasks

- [x] 1. Set up project dependencies and configuration
  - Install required npm packages: axios, fast-check (dev), ioredis integration
  - Create environment variable template for API keys
  - Set up test infrastructure with Jest configuration for unit, property, and integration tests
  - _Requirements: 1.4_

- [ ] 2. Implement core API Registry
  - [x] 2.1 Create API Registry class with configuration storage
    - Implement `src/lib/publicApi/apiRegistry.js` with configuration loading, validation, and retrieval methods
    - Support loading from environment variables and configuration files
    - Implement configuration schema validation with required field checks
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ]* 2.2 Write property tests for API Registry
    - **Property 1: Configuration Round-Trip** - Validates: Requirements 1.1
    - **Property 2: Configuration Validation Rejects Invalid Input** - Validates: Requirements 1.2, 14.1, 14.6
    - **Property 3: Authentication Method Support** - Validates: Requirements 1.3
    - **Property 4: Configuration Hot Reload** - Validates: Requirements 1.5
    - **Property 5: Category-Based Retrieval** - Validates: Requirements 1.6
    - **Property 6: HTTPS Protocol Enforcement** - Validates: Requirements 1.7
  
  - [ ]* 2.3 Write unit tests for API Registry
    - Test loading configurations from environment variables
    - Test validation of specific invalid configurations (missing fields, invalid URLs)
    - Test category filtering and retrieval
    - _Requirements: 1.1, 1.2, 1.6_

- [ ] 3. Implement Base API Client
  - [x] 3.1 Create BaseAPIClient abstract class
    - Implement `src/lib/publicApi/baseApiClient.js` with axios initialization
    - Implement GET, POST, PUT, DELETE methods with standardized response format
    - Add request timeout enforcement from configuration
    - _Requirements: 2.4, 2.6, 3.6_
  
  - [ ]* 3.2 Write property tests for Base API Client
    - **Property 11: Error Response Standardization** - Validates: Requirements 3.4
    - **Property 12: Request Timeout Enforcement** - Validates: Requirements 3.6
    - **Property 27: Response Transformation to Standard Format** - Validates: Requirements 7.1, 8.2, 9.2, 10.2
    - **Property 32: Metadata Preservation** - Validates: Requirements 7.7
  
  - [ ]* 3.3 Write unit tests for Base API Client
    - Test axios instance initialization with configuration
    - Test timeout handling with specific timeout values
    - Test standardized error response format
    - _Requirements: 2.4, 3.4, 3.6_

- [ ] 4. Implement Retry Handler
  - [x] 4.1 Create RetryHandler class with exponential backoff
    - Implement `src/lib/publicApi/retryHandler.js` with retry logic
    - Support retryable status codes (429, 500, 502, 503, 504)
    - Implement exponential backoff with configurable delays
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 4.2 Write property tests for Retry Handler
    - **Property 9: Retry on Retryable Status Codes** - Validates: Requirements 3.1
    - **Property 10: No Retry on Authentication Errors** - Validates: Requirements 3.5
  
  - [ ]* 4.3 Write unit tests for Retry Handler
    - Test exactly 3 retry attempts with 1s, 2s, 4s delays
    - Test no retry on 401/403 status codes
    - Test timeout handling during retries
    - _Requirements: 3.1, 3.2, 3.5_

- [ ] 5. Implement Cache Manager
  - [x] 5.1 Create APICacheManager class
    - Implement `src/lib/publicApi/cacheManager.js` with Redis integration
    - Implement cache key generation with parameter normalization
    - Implement get, set, invalidate methods with TTL support
    - Add cache statistics tracking
    - _Requirements: 4.1, 4.2, 4.3, 4.6_
  
  - [ ]* 5.2 Write property tests for Cache Manager
    - **Property 13: Cache Key Consistency** - Validates: Requirements 4.3
    - **Property 14: Cache Hit Avoids External Call** - Validates: Requirements 4.2
    - **Property 15: Successful Response Caching** - Validates: Requirements 4.1
    - **Property 16: Cache Invalidation** - Validates: Requirements 4.6
  
  - [ ]* 5.3 Write unit tests for Cache Manager
    - Test cache key generation with parameter order variations
    - Test TTL expiration behavior
    - Test cache failure graceful degradation
    - Test invalidation by API name and pattern
    - _Requirements: 4.1, 4.3, 4.6, 4.7_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Rate Limiter
  - [ ] 7.1 Create APIRateLimiter class
    - Implement `src/lib/publicApi/rateLimiter.js` with Redis counters
    - Support multiple time windows (second, minute, hour, day)
    - Implement quota checking and remaining quota calculation
    - Add Retry-After header generation
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_
  
  - [ ]* 7.2 Write property tests for Rate Limiter
    - **Property 17: Rate Limit Enforcement** - Validates: Requirements 5.2
    - **Property 18: Rate Limit Counter Accuracy** - Validates: Requirements 5.1
    - **Property 19: Rate Limit Window Support** - Validates: Requirements 5.3
    - **Property 20: Rate Limit Configuration Consistency** - Validates: Requirements 5.4
    - **Property 21: Retry-After Header Inclusion** - Validates: Requirements 5.5
    - **Property 22: Quota Check Non-Mutation** - Validates: Requirements 5.6
  
  - [ ]* 7.3 Write unit tests for Rate Limiter
    - Test specific rate limit configurations (5/min, 60/min)
    - Test Retry-After header format
    - Test monthly quota tracking
    - Test 80% quota warning threshold
    - _Requirements: 5.2, 5.5, 5.7_

- [ ] 8. Implement Health Monitor
  - [ ] 8.1 Create HealthMonitor class with circuit breaker
    - Implement `src/lib/publicApi/healthMonitor.js` with periodic health checks
    - Implement circuit breaker with closed/open/half-open states
    - Track health metrics (response time, success rate, uptime)
    - Emit health status change events
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7_
  
  - [ ]* 8.2 Write property tests for Health Monitor
    - **Property 23: Health Check Success Updates Status** - Validates: Requirements 6.2
    - **Property 24: Health Status Transition Events** - Validates: Requirements 6.5
    - **Property 25: Health Metrics Tracking** - Validates: Requirements 6.6
    - **Property 26: Circuit Breaker Activation** - Validates: Requirements 6.7
  
  - [ ]* 8.3 Write unit tests for Health Monitor
    - Test circuit breaker state transitions (closed → open → half-open → closed)
    - Test 5 consecutive failures threshold
    - Test 60-second open duration before half-open
    - Test health metrics calculation
    - _Requirements: 6.3, 6.7_

- [ ] 9. Implement Response Transformer
  - [ ] 9.1 Create ResponseTransformer class
    - Implement `src/lib/publicApi/responseTransformer.js` with format parsing
    - Support JSON, XML, and text response formats
    - Implement field mapping and validation
    - Support custom transformer registration
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_
  
  - [ ]* 9.2 Write property tests for Response Transformer
    - **Property 28: Field Mapping Consistency** - Validates: Requirements 7.2
    - **Property 29: Response Format Support** - Validates: Requirements 7.3
    - **Property 30: Required Field Validation** - Validates: Requirements 7.4, 7.5
    - **Property 31: Custom Transformer Registration** - Validates: Requirements 7.6
  
  - [ ]* 9.3 Write unit tests for Response Transformer
    - Test transformation of specific API response formats
    - Test missing field error handling
    - Test custom transformer function registration
    - _Requirements: 7.1, 7.4, 7.6_

- [ ] 10. Implement API Client Factory
  - [ ] 10.1 Create APIClientFactory class
    - Implement `src/lib/publicApi/apiClientFactory.js` with singleton pattern
    - Implement client creation with configuration injection
    - Add client lifecycle management (create, get, remove, reinitialize)
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 10.2 Write property tests for API Client Factory
    - **Property 7: Client Factory Singleton Pattern** - Validates: Requirements 2.3
    - **Property 8: Client Configuration Injection** - Validates: Requirements 2.2, 2.4
  
  - [ ]* 10.3 Write unit tests for API Client Factory
    - Test singleton pattern with multiple getClient calls
    - Test configuration injection from registry
    - Test client reinitialization
    - _Requirements: 2.1, 2.3_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement Weather API Client
  - [x] 12.1 Create WeatherAPIClient class extending BaseAPIClient
    - Implement `src/lib/publicApi/clients/weatherClient.js`
    - Implement getCurrentWeather, getCurrentWeatherByCity, getForecast methods
    - Implement weather-specific response transformation
    - Add temperature unit conversion (Celsius/Fahrenheit)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.7_
  
  - [ ]* 12.2 Write property tests for Weather API Client
    - **Property 33: Temperature Unit Conversion** - Validates: Requirements 8.4
    - **Property 34: Location Query Support** - Validates: Requirements 8.7
  
  - [ ]* 12.3 Write unit tests for Weather API Client
    - Test weather data transformation with all required fields
    - Test temperature conversion accuracy
    - Test cache TTL of 600 seconds
    - Test fallback response on unavailability
    - _Requirements: 8.2, 8.4, 8.5, 8.6_

- [ ] 13. Implement Finance API Client
  - [ ] 13.1 Create FinanceAPIClient class extending BaseAPIClient
    - Implement `src/lib/publicApi/clients/financeClient.js`
    - Implement getStockQuote, getBatchQuotes, getMarketStatus methods
    - Implement finance-specific response transformation
    - Add currency standardization with code and formatted string
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6_
  
  - [ ]* 13.2 Write property tests for Finance API Client
    - **Property 35: Batch Stock Quote Support** - Validates: Requirements 9.3
    - **Property 36: Currency Standardization** - Validates: Requirements 9.5
  
  - [ ]* 13.3 Write unit tests for Finance API Client
    - Test stock quote with all required fields
    - Test batch quote processing
    - Test cache TTL of 60 seconds during market hours
    - Test rate limit of 5 requests per minute
    - _Requirements: 9.2, 9.4, 9.7_

- [ ] 14. Implement News API Client
  - [ ] 14.1 Create NewsAPIClient class extending BaseAPIClient
    - Implement `src/lib/publicApi/clients/newsClient.js`
    - Implement getHeadlines, searchNews, getNewsByCategory methods
    - Implement news-specific response transformation
    - Add date formatting to ISO 8601
    - Add pagination support (max 20 articles per request)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6, 10.7_
  
  - [ ]* 14.2 Write property tests for News API Client
    - **Property 37: News Category Filtering** - Validates: Requirements 10.3
    - **Property 38: News Keyword Search** - Validates: Requirements 10.4
    - **Property 39: Date Format Standardization** - Validates: Requirements 10.6
  
  - [ ]* 14.3 Write unit tests for News API Client
    - Test news headline retrieval with all required fields
    - Test category filtering
    - Test keyword search
    - Test cache TTL of 900 seconds
    - Test pagination with 20 articles max
    - _Requirements: 10.2, 10.3, 10.5, 10.7_

- [ ] 15. Implement Data Enrichment Service
  - [ ] 15.1 Create DataEnrichmentService class
    - Implement `src/services/dataEnrichmentService.js`
    - Implement parallel API execution for enrichment pipelines
    - Implement partial failure handling with available data return
    - Add 15-second timeout for entire pipeline
    - Add source attribution for merged data
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  
  - [ ]* 15.2 Write property tests for Data Enrichment Service
    - **Property 40: Multi-Source Data Aggregation** - Validates: Requirements 11.1, 11.7
    - **Property 41: Partial Failure Handling** - Validates: Requirements 11.3
    - **Property 42: Pipeline Configuration Execution** - Validates: Requirements 11.4
    - **Property 43: Failure Isolation in Pipelines** - Validates: Requirements 11.5
  
  - [ ]* 15.3 Write unit tests for Data Enrichment Service
    - Test parallel execution (verify ~1s for 3 APIs with 1s delay each)
    - Test 15-second pipeline timeout
    - Test source attribution preservation
    - Test partial failure scenarios
    - _Requirements: 11.2, 11.3, 11.6_

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Implement Public API Service
  - [x] 17.1 Create PublicAPIService orchestrator
    - Implement `src/services/publicApiService.js`
    - Implement getWeather, getStockData, getNews methods
    - Implement executeRequest for generic API calls
    - Integrate with Cache Manager, Rate Limiter, and Health Monitor
    - Add graceful degradation with fallback mechanisms
    - _Requirements: 8.1, 9.1, 10.1, 15.1, 15.2, 15.3, 15.4, 15.6, 15.7_
  
  - [ ]* 17.2 Write property tests for Public API Service
    - **Property 51: Fallback to Cache on Unhealthy API** - Validates: Requirements 15.1
    - **Property 52: Automatic Fallback API Usage** - Validates: Requirements 15.3, 15.4
    - **Property 53: Fallback Usage Tracking** - Validates: Requirements 15.5
    - **Property 54: Non-Critical API Graceful Degradation** - Validates: Requirements 15.6
    - **Property 55: Automatic Recovery on Health Restoration** - Validates: Requirements 15.7
  
  - [ ]* 17.3 Write unit tests for Public API Service
    - Test fallback to cached data when API unhealthy
    - Test fallback API usage when primary fails
    - Test non-critical API failure handling
    - Test automatic recovery when API becomes healthy
    - _Requirements: 15.1, 15.3, 15.6, 15.7_

- [ ] 18. Implement API Usage Logging and Analytics
  - [ ] 18.1 Create ApiUsageLog model
    - Implement `src/models/ApiUsageLog.js` with Sequelize schema
    - Add indexes for apiName, userId, and timestamp
    - Configure TTL of 30 days for log entries
    - _Requirements: 12.1, 12.6_
  
  - [ ] 18.2 Add usage logging to Public API Service
    - Log every API request with required fields (API name, endpoint, response time, status, timestamp)
    - Implement usage statistics aggregation (total requests, success rate, average response time)
    - Implement cost calculation based on pricing tiers
    - Add quota warning at 80% threshold
    - _Requirements: 12.1, 12.2, 12.3, 12.5_
  
  - [ ]* 18.3 Write property tests for Analytics
    - **Property 44: Request Logging Completeness** - Validates: Requirements 3.7, 12.1
    - **Property 45: Usage Statistics Aggregation** - Validates: Requirements 12.2
    - **Property 46: Cost Calculation Accuracy** - Validates: Requirements 12.3
    - **Property 47: Quota Warning Threshold** - Validates: Requirements 5.7, 12.5
  
  - [ ]* 18.4 Write unit tests for Analytics
    - Test log entry format and required fields
    - Test statistics aggregation for specific time periods
    - Test cost calculation with sample pricing
    - Test 80% quota warning emission
    - Test 30-day log retention
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.6_

- [ ] 19. Implement Public API Controller
  - [x] 19.1 Create PublicAPIController with all endpoints
    - Implement `src/controllers/publicApi.controller.js`
    - Add weather endpoints (current, forecast)
    - Add finance endpoints (quote, batch quotes)
    - Add news endpoints (headlines, search)
    - Add management endpoints (registry, health, analytics, config validation)
    - Integrate authentication, rate limiting, and error handling middleware
    - _Requirements: 8.1, 9.1, 10.1, 13.1, 13.4, 14.1_
  
  - [ ]* 19.2 Write unit tests for Controller
    - Test all endpoint responses with mock services
    - Test error handling for invalid parameters
    - Test authentication middleware integration
    - Test rate limiting middleware integration
    - _Requirements: 8.1, 9.1, 10.1, 14.1_

- [ ] 20. Implement API Routes
  - [x] 20.1 Create route definitions
    - Implement `src/routes/publicApi.routes.js`
    - Define all API routes with appropriate HTTP methods
    - Apply authentication and rate limiting middleware
    - Wire routes to controller methods
    - _Requirements: 8.1, 9.1, 10.1_
  
  - [ ]* 20.2 Write integration tests for routes
    - Test complete request flow from route to external API
    - Test authentication enforcement
    - Test rate limiting across multiple requests
    - _Requirements: 8.1, 9.1, 10.1_

- [ ] 21. Implement API Registry Endpoints
  - [ ] 21.1 Add registry and documentation endpoints
    - Implement list all APIs endpoint with category filtering
    - Implement health status endpoint
    - Implement analytics endpoint with time range support
    - Implement configuration validation endpoint
    - Add example requests and responses to registry
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 14.1_
  
  - [ ]* 21.2 Write property tests for Registry Endpoints
    - **Property 48: Registry Health Status Inclusion** - Validates: Requirements 13.4
    - **Property 49: Registry Rate Limit Information** - Validates: Requirements 13.6
    - **Property 50: Validation Rule Enforcement** - Validates: Requirements 14.4, 14.5
  
  - [ ]* 21.3 Write unit tests for Registry Endpoints
    - Test API listing with category filter
    - Test health status inclusion in registry
    - Test analytics endpoint with time ranges
    - Test configuration validation with invalid inputs
    - _Requirements: 13.1, 13.4, 14.1_

- [ ] 22. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 23. Create default API configurations
  - [ ] 23.1 Set up configuration files
    - Create configuration templates for OpenWeatherMap, Alpha Vantage/Finnhub, NewsAPI
    - Document required environment variables in .env.example
    - Create configuration loading logic from environment
    - Add validation for required API keys
    - _Requirements: 1.1, 1.4, 8.1, 9.1, 10.1_

- [ ] 24. Integration testing with real Redis
  - [ ]* 24.1 Write end-to-end integration tests
    - Test complete weather request flow with caching
    - Test rate limiting across multiple requests with Redis
    - Test circuit breaker state transitions with Redis
    - Test fallback mechanisms with cache and fallback APIs
    - Test data enrichment pipelines
    - Test analytics aggregation with real database
    - _Requirements: 4.1, 5.2, 6.7, 11.2, 12.2, 15.1_

- [ ] 25. Wire everything together and final integration
  - [x] 25.1 Integrate with main Express app
    - Register public API routes in main app
    - Initialize API Registry on application startup
    - Start Health Monitor background process
    - Add graceful shutdown for health monitor
    - _Requirements: 1.4, 6.1_
  
  - [ ] 25.2 Add error handling middleware
    - Extend existing error handler with API-specific error codes
    - Add request ID generation for traceability
    - Ensure consistent error response format
    - _Requirements: 3.4_
  
  - [ ] 25.3 Add logging integration
    - Integrate with existing Winston logger
    - Add structured logging for API requests
    - Log health status changes
    - Log rate limit violations
    - _Requirements: 3.7, 6.5, 12.1_

- [ ] 26. Documentation and configuration
  - [ ] 26.1 Create API documentation
    - Document all public endpoints with request/response examples
    - Document configuration options and environment variables
    - Create setup guide for adding new APIs
    - Document rate limits and caching strategies
    - _Requirements: 13.2, 13.3_

- [ ] 27. Final checkpoint - Ensure all tests pass
  - Run complete test suite (unit, property, integration)
  - Verify test coverage meets goals (80% line, 75% branch, 85% function)
  - Ensure all 55 property tests pass with 100+ iterations
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations using fast-check
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests verify component interactions with real Redis
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- The implementation leverages existing infrastructure (Redis, Logger, RabbitMQ, Sequelize)
- All API clients follow the singleton pattern established by OpenRouter integration
- Configuration-driven architecture allows adding new APIs without code changes
