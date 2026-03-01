# Requirements Document

## Introduction

This document specifies requirements for cleaning up unused API keys, secrets, and endpoints from the codebase. The system currently contains environment variables for multiple API integrations (Judge0, OpenRouter, RabbitMQ, Redis, Weather API, Finance API, News API), but analysis reveals that Finance API and News API are not implemented, and the Weather API configuration is incomplete. Additionally, the API Registry has a critical bug where the `loadConfigurations()` method is called but not defined, preventing any API registrations from loading.

## Glossary

- **API_Key**: Authentication credential stored in environment variables for external API access
- **Environment_File**: Configuration file (.env, .env.example) containing API keys and secrets
- **API_Registry**: Singleton class managing API configurations and client instances
- **Unused_API**: API configuration present in environment files but not referenced in application code
- **Code_Scanner**: Analysis tool that searches codebase for API key references
- **Cleanup_System**: The feature being implemented to remove unused credentials
- **Weather_Client**: Specialized API client for OpenWeatherMap integration
- **Free_API**: Public API requiring no authentication (dog-ceo, cat-facts, poetrydb, etc.)

## Requirements

### Requirement 1: Identify Unused API Keys

**User Story:** As a developer, I want to identify all unused API keys in the codebase, so that I can safely remove unnecessary credentials.

#### Acceptance Criteria

1. THE Code_Scanner SHALL scan all environment files (.env, .env.example) for API key declarations
2. THE Code_Scanner SHALL search all JavaScript files for references to each discovered API key
3. WHEN an API key is not referenced in any JavaScript file, THE Code_Scanner SHALL mark it as unused
4. THE Code_Scanner SHALL generate a report listing all unused API keys with their environment variable names
5. THE Code_Scanner SHALL distinguish between completely unused keys and keys present but not properly integrated

### Requirement 2: Identify Unused API Endpoints

**User Story:** As a developer, I want to identify unused API endpoints and routes, so that I can remove dead code.

#### Acceptance Criteria

1. THE Code_Scanner SHALL analyze all route definitions in the routes directory
2. THE Code_Scanner SHALL verify each route has a corresponding controller implementation
3. THE Code_Scanner SHALL check if each controller method is actually called by any route
4. WHEN a route or controller method is unreachable, THE Code_Scanner SHALL mark it as unused
5. THE Code_Scanner SHALL generate a report of unused routes and controller methods

### Requirement 3: Remove Unused Environment Variables

**User Story:** As a developer, I want to remove unused environment variables, so that the configuration is clean and maintainable.

#### Acceptance Criteria

1. WHEN the user confirms removal, THE Cleanup_System SHALL delete unused API key entries from .env file
2. WHEN the user confirms removal, THE Cleanup_System SHALL delete unused API key entries from .env.example file
3. THE Cleanup_System SHALL preserve all comments and formatting in environment files
4. THE Cleanup_System SHALL remove entire configuration blocks for unused APIs (including related timeout, cache, and rate limit settings)
5. THE Cleanup_System SHALL maintain alphabetical or logical grouping of remaining variables

### Requirement 4: Remove Unused Code References

**User Story:** As a developer, I want to remove code that references unused APIs, so that the codebase is cleaner.

#### Acceptance Criteria

1. WHEN an API client implementation exists for an unused API, THE Cleanup_System SHALL remove the client file
2. WHEN service methods reference unused APIs, THE Cleanup_System SHALL remove those methods
3. THE Cleanup_System SHALL remove unused import statements after code removal
4. THE Cleanup_System SHALL preserve all code for APIs that are actively used
5. THE Cleanup_System SHALL update API Registry category validation to remove unused categories

### Requirement 5: Fix API Registry Initialization Bug

**User Story:** As a developer, I want the API Registry to properly initialize, so that registered APIs are available at runtime.

#### Acceptance Criteria

1. THE API_Registry SHALL define a `loadConfigurations()` method that calls `_loadFreeAPIs()`
2. WHEN the API_Registry constructor executes, THE API_Registry SHALL successfully load all free API configurations
3. THE API_Registry SHALL log successful registration of each API during initialization
4. WHEN `reloadConfigurations()` is called, THE API_Registry SHALL clear existing registrations and reload all configurations
5. THE API_Registry SHALL not throw errors during initialization due to missing method definitions

### Requirement 6: Verify Runtime Integrity

**User Story:** As a developer, I want to verify the application runs correctly after cleanup, so that no functionality is broken.

#### Acceptance Criteria

1. THE Cleanup_System SHALL execute the application startup sequence after cleanup
2. WHEN the application starts, THE Cleanup_System SHALL verify all remaining API integrations initialize successfully
3. THE Cleanup_System SHALL verify all route handlers are accessible and respond correctly
4. IF any runtime errors occur, THEN THE Cleanup_System SHALL report the error with file location and stack trace
5. THE Cleanup_System SHALL verify database connections (MongoDB, Redis, RabbitMQ) remain functional

### Requirement 7: Generate Cleanup Report

**User Story:** As a developer, I want a detailed report of all cleanup actions, so that I understand what was changed.

#### Acceptance Criteria

1. THE Cleanup_System SHALL generate a before-and-after summary document
2. THE Cleanup_System SHALL list all removed API keys with their environment variable names
3. THE Cleanup_System SHALL list all removed files with their full paths
4. THE Cleanup_System SHALL list all modified files with a summary of changes
5. THE Cleanup_System SHALL include migration notes for any breaking changes or required manual actions
6. THE Cleanup_System SHALL document all remaining API integrations and their status

### Requirement 8: Preserve Active API Integrations

**User Story:** As a developer, I want all active API integrations to remain functional, so that existing features continue working.

#### Acceptance Criteria

1. THE Cleanup_System SHALL preserve Judge0 API configuration and all references (RAPIDAPI_KEY, JUDGE0_API_URL)
2. THE Cleanup_System SHALL preserve OpenRouter AI configuration and all references (OPENROUTER_API_KEY, OPENROUTER_BASE_URL, OPENROUTER_MODEL)
3. THE Cleanup_System SHALL preserve Redis configuration (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD)
4. THE Cleanup_System SHALL preserve RabbitMQ configuration (RABBITMQ_URL)
5. THE Cleanup_System SHALL preserve MongoDB configuration (MONGODB_URI)
6. THE Cleanup_System SHALL preserve all Free API registrations (dog-ceo, cat-facts, poetrydb, gutendex, nasa-apod, numbers-api)
7. THE Cleanup_System SHALL preserve JWT authentication configuration (JWT_SECRET)

### Requirement 9: Scan Git History for Exposed Secrets

**User Story:** As a security engineer, I want to verify no secrets remain in git history, so that credentials are not exposed.

#### Acceptance Criteria

1. THE Code_Scanner SHALL search git commit history for patterns matching API keys
2. WHEN API keys are found in git history, THE Code_Scanner SHALL report the commit hash and file path
3. THE Code_Scanner SHALL check for common secret patterns (keys starting with "sk-", long alphanumeric strings in quotes)
4. THE Code_Scanner SHALL generate a security report listing all historical secret exposures
5. IF secrets are found in history, THEN THE Code_Scanner SHALL recommend using git-filter-repo or BFG Repo-Cleaner

### Requirement 10: Remove Incomplete Weather API Integration

**User Story:** As a developer, I want to remove the incomplete Weather API integration, so that only fully implemented features remain.

#### Acceptance Criteria

1. THE Cleanup_System SHALL remove all WEATHER_API environment variables from .env and .env.example
2. THE Cleanup_System SHALL remove the Weather_Client file (src/lib/publicApi/clients/weatherClient.js)
3. THE Cleanup_System SHALL remove weather-related methods from publicApiService (getWeather, getForecast)
4. THE Cleanup_System SHALL remove the 'openweathermap' case from the service client factory
5. THE Cleanup_System SHALL verify no references to 'openweathermap' remain in the codebase after removal

