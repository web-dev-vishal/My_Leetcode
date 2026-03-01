# Implementation Plan: API Cleanup System

## Overview

This implementation plan breaks down the API Cleanup System into discrete coding tasks. The system will scan the codebase for unused API integrations, remove them safely, fix the API Registry initialization bug, and verify runtime integrity. Each task builds incrementally on previous work, with checkpoints to ensure stability.

## Tasks

- [~] 1. Set up project structure and core interfaces
  - Create `src/cleanup/` directory for cleanup system components
  - Define TypeScript interfaces for data structures (EnvVariable, CodeReference, ScanResult, CleanupResult)
  - Set up testing framework with Jest and fast-check for property-based testing
  - Create utility modules for file operations and logging
  - _Requirements: All requirements (foundation)_

- [ ] 2. Implement Code Scanner component
  - [~] 2.1 Implement environment file parser
    - Create `src/cleanup/scanner/envParser.js` to parse .env and .env.example files
    - Extract API key declarations with line numbers and related variables
    - Group related variables by prefix (e.g., all WEATHER_API_* together)
    - _Requirements: 1.1_
  
  - [ ]* 2.2 Write property test for environment file scanning
    - **Property 1: Environment File Scanning Completeness**
    - **Validates: Requirements 1.1**
  
  - [~] 2.3 Implement code reference finder
    - Create `src/cleanup/scanner/referenceFinder.js` to search JavaScript files for API key references
    - Use ripgrep for fast text-based searching
    - Detect both direct references (process.env.VAR_NAME) and indirect references (imported from config)
    - Track reference locations with file path, line number, and context
    - _Requirements: 1.2_
  
  - [ ]* 2.4 Write property test for code reference detection
    - **Property 2: Code Reference Detection**
    - **Validates: Requirements 1.2**
  
  - [~] 2.5 Implement unused API classifier
    - Create `src/cleanup/scanner/classifier.js` to classify APIs as unused, active, or incomplete
    - Mark APIs with zero code references as unused
    - Distinguish between completely unused and partially implemented APIs
    - _Requirements: 1.3, 1.5_
  
  - [ ]* 2.6 Write property test for unused API classification
    - **Property 3: Unused API Classification**
    - **Validates: Requirements 1.3, 1.5**
  
  - [~] 2.7 Implement route analyzer
    - Create `src/cleanup/scanner/routeAnalyzer.js` to analyze route definitions and controllers
    - Verify each route has a corresponding controller implementation
    - Check if each controller method is called by at least one route
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 2.8 Write property test for route-controller correspondence
    - **Property 4: Route-Controller Correspondence**
    - **Validates: Requirements 2.2, 2.3, 2.4**
  
  - [~] 2.9 Implement analysis report generator
    - Create `src/cleanup/scanner/reportGenerator.js` to generate scan results
    - List all unused APIs with environment variables and code files
    - List all active APIs with references
    - List incomplete APIs with missing components
    - _Requirements: 1.4, 2.5_
  
  - [~] 2.10 Create CodeScanner main class
    - Create `src/cleanup/scanner/CodeScanner.js` to orchestrate all scanner components
    - Implement `scanEnvironmentFiles()`, `findCodeReferences()`, `identifyUnusedAPIs()`, `analyzeRoutes()`, `generateReport()` methods
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [~] 3. Checkpoint - Verify scanner functionality
  - Run scanner against the actual codebase
  - Verify it correctly identifies Finance API, News API, and Weather API as unused
  - Verify it correctly identifies Judge0, OpenRouter, Redis, RabbitMQ, MongoDB, JWT, and Free APIs as active
  - Ensure all tests pass, ask the user if questions arise

- [ ] 4. Implement Cleanup Engine component
  - [~] 4.1 Implement environment variable remover
    - Create `src/cleanup/engine/envRemover.js` to remove unused environment variables
    - Parse .env and .env.example line by line
    - Preserve comments, blank lines, and formatting
    - Remove entire configuration blocks for unused APIs
    - Write updated content atomically
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 4.2 Write property test for environment variable removal preservation
    - **Property 5: Environment Variable Removal Preservation**
    - **Validates: Requirements 3.3**
  
  - [ ]* 4.3 Write property test for configuration block removal
    - **Property 6: Configuration Block Removal**
    - **Validates: Requirements 3.4**
  
  - [~] 4.4 Implement code file remover
    - Create `src/cleanup/engine/fileRemover.js` to delete unused code files
    - Delete `src/lib/publicApi/clients/weatherClient.js`
    - Remove any test files associated with unused APIs
    - Create backups before deletion
    - _Requirements: 4.1_
  
  - [~] 4.5 Implement code reference remover
    - Create `src/cleanup/engine/codeRemover.js` to remove unused methods and imports
    - Remove unused methods from `publicApiService.js` (getWeather, getForecast)
    - Remove unused switch cases from client factory
    - Remove unused imports after method removal
    - Use AST-based code modification to ensure syntactic correctness
    - _Requirements: 4.2, 4.3_
  
  - [ ]* 4.6 Write property test for import cleanup after code removal
    - **Property 8: Import Cleanup After Code Removal**
    - **Validates: Requirements 4.3**
  
  - [~] 4.7 Implement registry validation updater
    - Create `src/cleanup/engine/registryUpdater.js` to update API Registry validation
    - Remove 'weather', 'finance', 'news' from validCategories array
    - Keep only active categories: 'animals', 'books', 'science', 'utility'
    - _Requirements: 4.5_
  
  - [~] 4.8 Implement cleanup transaction manager
    - Create `src/cleanup/engine/transaction.js` for rollback capability
    - Create backups before modifying any files
    - Implement rollback() to restore original state on error
    - Implement commit() to finalize changes
    - _Requirements: All cleanup requirements (safety)_
  
  - [~] 4.9 Create CleanupEngine main class
    - Create `src/cleanup/engine/CleanupEngine.js` to orchestrate all cleanup operations
    - Implement `removeEnvironmentVariables()`, `removeCodeFiles()`, `removeCodeReferences()`, `updateRegistryValidation()`, `executeCleanup()` methods
    - Integrate transaction manager for safe operations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 4.10 Write property test for active API preservation
    - **Property 7: Active API Preservation**
    - **Validates: Requirements 4.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

- [~] 5. Checkpoint - Verify cleanup engine functionality
  - Test cleanup engine with mock data
  - Verify it correctly removes unused resources
  - Verify it preserves active resources
  - Test rollback functionality
  - Ensure all tests pass, ask the user if questions arise

- [ ] 6. Fix API Registry initialization bug
  - [~] 6.1 Implement Registry Patcher
    - Create `src/cleanup/patcher/RegistryPatcher.js` to fix the API Registry bug
    - Implement `analyzeBug()` to identify the missing loadConfigurations() method
    - Implement `patchLoadConfigurations()` to add the missing method
    - Use AST-based code editing to insert the method after the constructor
    - Add logging for observability
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 6.2 Write property test for registry initialization success
    - **Property 9: Registry Initialization Success**
    - **Validates: Requirements 5.2, 5.5**
  
  - [ ]* 6.3 Write property test for registry reload idempotence
    - **Property 10: Registry Reload Idempotence**
    - **Validates: Requirements 5.4**
  
  - [~] 6.4 Apply the patch to apiRegistry.js
    - Run the patcher against `src/lib/publicApi/apiRegistry.js`
    - Verify the loadConfigurations() method is added correctly
    - Verify the method calls _loadFreeAPIs()
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7. Implement Verification System component
  - [~] 7.1 Implement startup verifier
    - Create `src/cleanup/verifier/startupVerifier.js` to verify application startup
    - Import and instantiate the main application module
    - Catch any import errors or initialization failures
    - Verify no undefined method errors occur
    - _Requirements: 6.1, 6.2_
  
  - [~] 7.2 Implement registry verifier
    - Create `src/cleanup/verifier/registryVerifier.js` to verify API Registry initialization
    - Import apiRegistry singleton
    - Verify apis Map is populated
    - Check that all 6 free APIs are registered
    - Verify no errors in console logs
    - _Requirements: 6.2_
  
  - [~] 7.3 Implement route verifier
    - Create `src/cleanup/verifier/routeVerifier.js` to verify route handlers
    - Load all route definitions
    - Verify each route has a corresponding controller method
    - Check that removed routes (weather endpoints) are no longer present
    - Verify remaining routes are accessible
    - _Requirements: 6.3_
  
  - [~] 7.4 Implement database verifier
    - Create `src/cleanup/verifier/databaseVerifier.js` to verify database connections
    - Test MongoDB connection
    - Test Redis connection
    - Test RabbitMQ connection
    - Verify all connections succeed without errors
    - _Requirements: 6.5_
  
  - [~] 7.5 Create VerificationSystem main class
    - Create `src/cleanup/verifier/VerificationSystem.js` to orchestrate all verification
    - Implement `verifyStartup()`, `verifyRegistryInitialization()`, `verifyRoutes()`, `verifyDatabaseConnections()`, `runFullVerification()` methods
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 7.6 Write property test for verification error reporting
    - **Property 11: Verification Error Reporting**
    - **Validates: Requirements 6.4**

- [ ] 8. Implement Report Generator component
  - [~] 8.1 Implement summary generator
    - Create `src/cleanup/reporter/summaryGenerator.js` to generate before/after summary
    - Document total APIs removed, environment variables removed, files deleted, lines of code removed
    - Document bugs fixed
    - _Requirements: 7.1_
  
  - [~] 8.2 Implement removal documenter
    - Create `src/cleanup/reporter/removalDocumenter.js` to document removed resources
    - List all removed environment variables with names
    - List all deleted files with full paths
    - List all modified files with change summaries
    - _Requirements: 7.2, 7.3, 7.4_
  
  - [~] 8.3 Implement preservation documenter
    - Create `src/cleanup/reporter/preservationDocumenter.js` to document preserved resources
    - List all active API integrations with their environment variables
    - Document all remaining configurations
    - _Requirements: 7.6_
  
  - [~] 8.4 Implement migration notes generator
    - Create `src/cleanup/reporter/migrationNotes.js` to generate migration notes
    - Document any breaking changes or required manual actions
    - Note that no breaking changes are expected for this cleanup
    - _Requirements: 7.5_
  
  - [~] 8.5 Create ReportGenerator main class
    - Create `src/cleanup/reporter/ReportGenerator.js` to orchestrate report generation
    - Implement `generateSummary()`, `documentRemovals()`, `documentPreserved()`, `generateMigrationNotes()`, `createFinalReport()` methods
    - Generate markdown report file
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 8.6 Write property test for cleanup report completeness
    - **Property 12: Cleanup Report Completeness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6**

- [ ] 9. Implement Git History Scanner component
  - [~] 9.1 Implement git log analyzer
    - Create `src/cleanup/security/gitLogAnalyzer.js` to search git history
    - Use `git log -p` to get full patch history
    - Search for patterns matching API keys (sk-*, long alphanumeric strings)
    - Identify commits that added or modified .env files
    - _Requirements: 9.1, 9.2_
  
  - [~] 9.2 Implement secret pattern detector
    - Create `src/cleanup/security/patternDetector.js` to detect secret patterns
    - Define regex patterns for common secret formats
    - Distinguish between example values and real secrets
    - _Requirements: 9.3_
  
  - [~] 9.3 Implement security report generator
    - Create `src/cleanup/security/securityReporter.js` to generate security report
    - List all commits where secrets were found
    - Provide commit hash, date, author, and file path
    - Recommend remediation steps (git-filter-repo, key rotation)
    - _Requirements: 9.4, 9.5_
  
  - [~] 9.4 Create GitHistoryScanner main class
    - Create `src/cleanup/security/GitHistoryScanner.js` to orchestrate security scanning
    - Implement `scanHistory()`, `detectSecretPatterns()`, `generateSecurityReport()` methods
    - Handle cases where git is not available
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 9.5 Write property test for git history pattern detection
    - **Property 13: Git History Pattern Detection**
    - **Validates: Requirements 9.1, 9.2, 9.3**
  
  - [ ]* 9.6 Write property test for security report recommendations
    - **Property 14: Security Report Recommendations**
    - **Validates: Requirements 9.5**

- [~] 10. Checkpoint - Verify all components work independently
  - Test each component in isolation
  - Verify all unit tests pass
  - Verify all property tests pass
  - Ensure all tests pass, ask the user if questions arise

- [ ] 11. Implement main orchestrator and CLI
  - [~] 11.1 Create main orchestrator
    - Create `src/cleanup/CleanupOrchestrator.js` to coordinate all components
    - Implement workflow: scan → cleanup → patch → verify → report
    - Handle errors and rollback on failure
    - _Requirements: All requirements (orchestration)_
  
  - [~] 11.2 Create CLI interface
    - Create `src/cleanup/cli.js` for command-line interface
    - Add commands: scan, cleanup, verify, report, full
    - Add flags: --dry-run, --skip-verification, --verbose
    - _Requirements: All requirements (user interface)_
  
  - [~] 11.3 Add npm scripts
    - Add `cleanup:scan` script to package.json
    - Add `cleanup:run` script to package.json
    - Add `cleanup:verify` script to package.json
    - _Requirements: All requirements (convenience)_

- [ ] 12. Execute end-to-end cleanup workflow
  - [~] 12.1 Run scanner on actual codebase
    - Execute CodeScanner against the real codebase
    - Review scan results to confirm unused APIs are correctly identified
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 12.2 Execute cleanup operations
    - Run CleanupEngine to remove unused resources
    - Remove Finance API, News API, and Weather API configurations
    - Remove weatherClient.js file
    - Remove unused methods from publicApiService.js
    - Update API Registry validation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 10.1, 10.2, 10.3, 10.4_
  
  - [x] 12.3 Apply API Registry bug fix
    - Run RegistryPatcher to fix loadConfigurations() method
    - Verify the fix is applied correctly
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [-] 12.4 Run verification suite
    - Execute VerificationSystem to verify application integrity
    - Verify application starts successfully
    - Verify API Registry loads all free APIs
    - Verify all routes are accessible
    - Verify database connections work
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [~] 12.5 Generate final reports
    - Run ReportGenerator to create cleanup report
    - Run GitHistoryScanner to create security report
    - Review reports for completeness
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 12.6 Write property test for post-cleanup reference absence
    - **Property 15: Post-Cleanup Reference Absence**
    - **Validates: Requirements 10.5**

- [~] 13. Final checkpoint - Comprehensive verification
  - Run the complete application to verify functionality
  - Execute all existing tests to ensure no regressions
  - Verify all removed APIs have zero references in the codebase
  - Verify all active APIs continue to work correctly
  - Review cleanup report and security report
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- The cleanup system uses a transaction-based approach with rollback capability for safety
- All file modifications are atomic to prevent corruption
- The system preserves all active integrations: Judge0, OpenRouter, Redis, RabbitMQ, MongoDB, JWT, and Free APIs
