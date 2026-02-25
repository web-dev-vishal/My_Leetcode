# Implementation Plan: Prisma to Mongoose Migration

## Overview

This implementation plan converts a LeetCode clone backend from Prisma ORM with PostgreSQL to MongoDB with Mongoose. The migration follows an 8-day phased approach, preserving all existing functionality while adapting to MongoDB's document-oriented paradigm. Each task builds incrementally, with checkpoints to validate progress.

## Tasks

- [ ] 1. Phase 1: Setup and Infrastructure (Day 1)
  - [ ] 1.1 Install Mongoose and update dependencies
    - Run `npm install mongoose`
    - Remove `@prisma/client` and `prisma` from package.json
    - Update Docker configuration to use MongoDB instead of PostgreSQL
    - Add `MONGODB_URI` to .env file
    - _Requirements: 2.1, 8.6, 8.7_

  - [ ] 1.2 Create Mongoose models directory structure
    - Create `src/models/` directory
    - Set up index file for model exports if needed
    - _Requirements: 1.1_

  - [ ] 1.3 Implement MongoDB connection module
    - Create `src/lib/db.js` with Mongoose connection logic
    - Implement connection pooling configuration
    - Add connection event handlers (connected, error, disconnected)
    - Implement graceful shutdown on SIGINT
    - Remove Prisma Client initialization code
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 2. Phase 2: Create Mongoose Schemas (Day 1-2)
  - [ ] 2.1 Create User schema
    - Define User schema in `src/models/User.js`
    - Add fields: name, email, image, role, password
    - Configure timestamps option for createdAt/updatedAt
    - Add unique constraint on email with sparse option for name
    - Add role index
    - Export User model
    - _Requirements: 1.1, 1.6, 1.7, 1.8, 6.6_

  - [ ] 2.2 Create TokenBlacklist schema
    - Define TokenBlacklist schema in `src/models/TokenBlacklist.js`
    - Add fields: token, expiresAt
    - Add unique constraint on token
    - Add TTL index on expiresAt for automatic expiration
    - Configure timestamps with createdAt only
    - Export TokenBlacklist model
    - _Requirements: 1.1, 1.6, 1.7, 1.8_

  - [ ] 2.3 Create Problem schema
    - Define Problem schema in `src/models/Problem.js`
    - Add fields: title, description, difficulty, tags, userId, examples, constraints, hints, editorial, testCases, codeSnippets, referenceSolutions
    - Add enum validation for difficulty (EASY, MEDIUM, HARD)
    - Add ObjectId reference to User via userId
    - Use Mixed type for JSON fields (examples, testCases, codeSnippets, referenceSolutions)
    - Add indexes on difficulty, userId, and tags
    - Configure timestamps
    - Add virtual populate for solvedBy and submissions
    - Export Problem model
    - _Requirements: 1.2, 1.6, 1.7, 1.8, 4.2, 10.1_

  - [ ] 2.4 Create Submission schema with embedded TestCaseResults
    - Define TestCaseResult subdocument schema
    - Define Submission schema in `src/models/Submission.js`
    - Add fields: userId, problemId, sourceCode, language, stdin, stdout, stderr, compileOutput, status, memory, time
    - Embed testCases array using TestCaseResult schema
    - Add ObjectId references to User and Problem
    - Use Mixed type for sourceCode JSON field
    - Add indexes on status, userId, problemId, and compound index on userId+problemId
    - Configure timestamps with createdAt only
    - Export Submission model
    - _Requirements: 1.3, 1.4, 1.6, 1.7, 1.8, 4.1, 4.2, 4.4, 10.1_

  - [ ] 2.5 Create ProblemSolved schema
    - Define ProblemSolved schema in `src/models/ProblemSolved.js`
    - Add fields: userId, problemId
    - Add ObjectId references to User and Problem
    - Add compound unique index on userId+problemId
    - Configure timestamps with createdAt only
    - Export ProblemSolved model
    - _Requirements: 1.1, 1.6, 1.7, 1.8, 4.1, 4.2_

  - [ ] 2.6 Create Playlist schema
    - Define Playlist schema in `src/models/Playlist.js`
    - Add fields: name, description, userId
    - Add ObjectId reference to User
    - Add compound unique index on name+userId
    - Configure timestamps
    - Export Playlist model
    - _Requirements: 1.5, 1.6, 1.7, 1.8, 4.3_

  - [ ] 2.7 Create ProblemInPlaylist schema
    - Define ProblemInPlaylist schema in `src/models/ProblemInPlaylist.js`
    - Add fields: playlistId, problemId
    - Add ObjectId references to Playlist and Problem
    - Add compound unique index on playlistId+problemId
    - Configure timestamps with createdAt only
    - Export ProblemInPlaylist model
    - _Requirements: 1.1, 1.6, 1.7, 1.8, 4.5_

- [ ] 3. Checkpoint - Verify schemas and connection
  - Ensure all schemas are created correctly
  - Test MongoDB connection
  - Verify indexes are created
  - Ask the user if questions arise

- [ ] 4. Phase 3: Migrate Auth Controller (Day 2)
  - [ ] 4.1 Convert auth controller to Mongoose
    - Replace Prisma imports with User and TokenBlacklist model imports in `src/controllers/auth.controller.js`
    - Convert user registration: replace `db.user.create` with `User.create`
    - Convert user login: replace `db.user.findUnique({ where: { email } })` with `User.findOne({ email })`
    - Convert token blacklist operations: replace Prisma queries with TokenBlacklist model methods
    - Add Mongoose error handling (ValidationError, CastError, E11000)
    - Maintain same response structures and status codes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 9.1, 9.2, 9.3, 9.5_

  - [ ]* 4.2 Write unit tests for auth controller
    - Test user registration with valid data
    - Test user registration with duplicate email (409 error)
    - Test user login with valid credentials
    - Test user login with invalid credentials (401 error)
    - Test token blacklist creation and validation
    - _Requirements: 5.1, 5.2, 5.3, 9.3_

- [ ] 5. Phase 4: Migrate Problem Controller (Day 3)
  - [ ] 5.1 Convert problem CRUD operations
    - Replace Prisma imports with Problem model import in `src/controllers/problem.controller.js`
    - Convert create problem: replace `db.problem.create` with `Problem.create`
    - Convert get problem by ID: replace `db.problem.findUnique` with `Problem.findById`
    - Convert list problems: replace `db.problem.findMany` with `Problem.find`
    - Convert update problem: replace `db.problem.update` with `Problem.findByIdAndUpdate` (with `new: true` and `runValidators: true`)
    - Convert delete problem: replace `db.problem.delete` with `Problem.findByIdAndDelete`
    - Handle null returns with 404 responses
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 9.4_

  - [ ] 5.2 Convert problem query operations
    - Convert filtering: replace Prisma `where` with Mongoose filter objects
    - Convert sorting: replace `orderBy` with `.sort()` method
    - Convert pagination: replace `skip` and `take` with `.skip()` and `.limit()`
    - Convert field selection: replace `select` with `.select()` method
    - Add lean() for read-only queries to improve performance
    - _Requirements: 3.7, 3.8, 3.9, 3.10, 5.5, 5.6, 10.2, 10.3_

  - [ ] 5.3 Convert problem relationship queries
    - Replace Prisma `include` with `.populate()` for loading related data
    - Implement virtual populate for solvedBy relationship
    - Handle nested where clauses (e.g., problems solved by user) by querying ProblemSolved first
    - Use populate with select to limit fields from referenced documents
    - _Requirements: 4.6, 4.7, 10.4_

  - [ ]* 5.4 Write unit tests for problem controller
    - Test create problem with valid data
    - Test get problem by ID (found and not found cases)
    - Test list problems with filtering by difficulty
    - Test list problems with sorting and pagination
    - Test update problem
    - Test delete problem
    - Test invalid ObjectId handling (CastError)
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 9.2, 9.4_

  - [ ]* 5.5 Write property test for problem CRUD operations
    - **Property 3: CRUD Operation Equivalence**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
    - Generate random problem data with fast-check
    - Test create then read returns equivalent document
    - Test update then read returns updated values
    - Test delete removes document
    - Run 100 iterations

  - [ ]* 5.6 Write property test for query filtering
    - **Property 4: Query Filtering Equivalence**
    - **Validates: Requirements 3.8**
    - Generate random difficulty values
    - Test filtering by difficulty returns only matching documents
    - Verify all returned documents match filter criteria
    - Run 100 iterations

- [ ] 6. Checkpoint - Verify problem controller migration
  - Test all problem endpoints manually
  - Verify query performance with indexes
  - Ensure error handling works correctly
  - Ask the user if questions arise

- [ ] 7. Phase 5: Migrate Submission Controller (Day 4)
  - [ ] 7.1 Convert submission CRUD operations
    - Replace Prisma imports with Submission model import in `src/controllers/submission.controller.js`
    - Convert create submission: replace `db.submission.create` with `Submission.create`
    - Handle embedded testCases array in submission creation
    - Convert get submission by ID: replace `db.submission.findUnique` with `Submission.findById`
    - Convert list submissions: replace `db.submission.findMany` with `Submission.find`
    - Convert update submission: replace `db.submission.update` with `Submission.findByIdAndUpdate`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.4, 5.1_

  - [ ] 7.2 Convert submission relationship queries
    - Replace Prisma include for user and problem with `.populate(['userId', 'problemId'])`
    - Implement queries for user submissions: `Submission.find({ userId })`
    - Implement queries for problem submissions: `Submission.find({ problemId })`
    - Use compound index on userId+problemId for efficient queries
    - _Requirements: 4.1, 4.2, 4.6, 10.1_

  - [ ] 7.3 Handle submission filtering and aggregation
    - Convert status filtering: `Submission.find({ status })`
    - Implement count operations: replace `db.submission.count` with `Submission.countDocuments`
    - Implement aggregation for submission statistics using aggregation pipeline
    - _Requirements: 3.8, 6.4, 6.5_

  - [ ]* 7.4 Write unit tests for submission controller
    - Test create submission with embedded test cases
    - Test get submission by ID with populated user and problem
    - Test list submissions filtered by status
    - Test list submissions for specific user
    - Test list submissions for specific problem
    - Test submission count operations
    - _Requirements: 4.4, 5.1, 6.4_

  - [ ]* 7.5 Write property test for embedded documents
    - **Property 10: Embedded Document Accessibility**
    - **Validates: Requirements 4.4**
    - Generate random submission with test cases
    - Create submission with embedded testCases
    - Verify all test cases are accessible from parent document
    - Verify no separate query needed for test cases
    - Run 100 iterations

  - [ ]* 7.6 Write property test for reference integrity
    - **Property 9: Reference Integrity**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.8**
    - Create user and problem first
    - Create submission with valid userId and problemId references
    - Verify referenced documents exist
    - Test that invalid references are rejected
    - Run 100 iterations

- [ ] 8. Phase 6: Migrate Playlist and ProblemSolved Controllers (Day 4)
  - [ ] 8.1 Convert playlist controller operations
    - Replace Prisma imports with Playlist and ProblemInPlaylist models in `src/controllers/playlist.controller.js`
    - Convert create playlist: replace `db.playlist.create` with `Playlist.create`
    - Convert add problem to playlist: replace nested Prisma create with `ProblemInPlaylist.create`
    - Convert get playlist with problems: use populate to load problems via ProblemInPlaylist
    - Convert update and delete playlist operations
    - Handle compound unique constraint on name+userId
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.3, 4.5, 4.6_

  - [ ] 8.2 Convert ProblemSolved operations
    - Replace Prisma imports with ProblemSolved model in relevant controllers
    - Convert marking problem as solved: replace `db.problemSolved.create` with `ProblemSolved.create`
    - Convert checking if problem is solved: `ProblemSolved.findOne({ userId, problemId })`
    - Convert getting solved problems for user: query ProblemSolved then populate problems
    - Handle compound unique constraint on userId+problemId
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.7_

  - [ ]* 8.3 Write unit tests for playlist and ProblemSolved
    - Test create playlist with unique name per user
    - Test add problem to playlist
    - Test get playlist with populated problems
    - Test mark problem as solved
    - Test get solved problems for user
    - Test duplicate key errors for unique constraints
    - _Requirements: 5.1, 9.3_

- [ ] 9. Phase 7: Advanced Features and Error Handling (Day 5)
  - [ ] 9.1 Implement transaction support
    - Identify operations that need transactions (e.g., creating submission and updating problem solved)
    - Replace Prisma `$transaction` with Mongoose `startSession` and `withTransaction`
    - Wrap multi-document operations in sessions
    - Handle transaction errors and rollback
    - _Requirements: 6.1_

  - [ ] 9.2 Implement connect-or-create pattern
    - Identify Prisma `connectOrCreate` usages
    - Implement equivalent logic: `findOne` followed by `create` if not found
    - Use upsert pattern where appropriate: `findOneAndUpdate` with `upsert: true`
    - _Requirements: 6.2, 3.6_

  - [ ] 9.3 Implement centralized error handler middleware
    - Create `src/middleware/errorHandler.js`
    - Handle ValidationError: return 400 with field details
    - Handle CastError: return 400 with invalid ID message
    - Handle E11000 duplicate key error: return 409 with conflict details
    - Handle generic errors: return 500 with error message
    - Maintain same error response format as Prisma implementation
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6_

  - [ ] 9.4 Add error handler to Express app
    - Import errorHandler middleware in main app file
    - Add as last middleware: `app.use(errorHandler)`
    - Update all controllers to use `next(error)` instead of inline error handling
    - _Requirements: 9.5, 9.6_

  - [ ]* 9.5 Write property test for error handling
    - **Property 25: Validation Error Handling**
    - **Validates: Requirements 9.1**
    - Generate invalid data (missing required fields, invalid enums)
    - Verify ValidationError returns 400 status
    - Verify error response includes field details
    - Run 100 iterations

  - [ ]* 9.6 Write property test for duplicate key errors
    - **Property 27: Duplicate Key Error Handling**
    - **Validates: Requirements 9.3**
    - Create document with unique field
    - Attempt to create duplicate
    - Verify E11000 error returns 409 status
    - Run 100 iterations

- [ ] 10. Checkpoint - Verify all controllers and error handling
  - Test all API endpoints end-to-end
  - Verify error responses match expected format
  - Test transaction scenarios
  - Ask the user if questions arise

- [ ] 11. Phase 8: Testing Suite (Day 5-6)
  - [ ] 11.1 Set up property-based testing framework
    - Install fast-check: `npm install --save-dev fast-check`
    - Create `tests/property/` directory
    - Configure test runner for property tests
    - _Requirements: All correctness properties_

  - [ ]* 11.2 Write property tests for data type preservation
    - **Property 1: Data Type Preservation**
    - **Validates: Requirements 1.6**
    - Generate documents with various field types
    - Create and retrieve documents
    - Verify field types match schema definitions
    - Run 100 iterations

  - [ ]* 11.3 Write property tests for schema validation
    - **Property 2: Schema Validation Enforcement**
    - **Validates: Requirements 1.7**
    - Generate invalid data violating constraints
    - Verify operations are rejected with validation errors
    - Test required fields, unique constraints, enum values
    - Run 100 iterations

  - [ ]* 11.4 Write property tests for query operations
    - **Property 6: Query Ordering Preservation**
    - **Validates: Requirements 3.9, 5.5**
    - Generate random sort criteria
    - Verify documents returned in correct order
    - Run 100 iterations
    
  - [ ]* 11.5 Write property tests for pagination
    - **Property 7: Pagination Consistency**
    - **Validates: Requirements 3.10, 5.6**
    - Generate random skip and limit values
    - Verify correct subset of documents returned
    - Run 100 iterations

  - [ ]* 11.6 Write property tests for populate operations
    - **Property 11: Populate Equivalence**
    - **Validates: Requirements 4.6**
    - Create documents with references
    - Use populate to load related documents
    - Verify related data matches expected structure
    - Run 100 iterations

  - [ ]* 11.7 Write property tests for timestamps
    - **Property 20: Automatic Timestamp Management**
    - **Validates: Requirements 6.6**
    - Create documents and verify createdAt and updatedAt are set
    - Update documents and verify only updatedAt changes
    - Run 100 iterations

  - [ ]* 11.8 Write property tests for ObjectId generation
    - **Property 21: ID Generation Consistency**
    - **Validates: Requirements 6.7**
    - Create documents without specifying _id
    - Verify unique ObjectId is automatically generated
    - Run 100 iterations

  - [ ]* 11.9 Write integration tests for API endpoints
    - Test complete user registration and login flow
    - Test complete problem creation and submission flow
    - Test playlist creation and problem addition flow
    - Test error scenarios across all endpoints
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 12. Phase 9: Data Migration (Day 7)
  - [ ] 12.1 Create data export script
    - Create `migration/export-prisma-data.js`
    - Export all data from Prisma database using Prisma Client
    - Save exported data to JSON file
    - Log record counts for each model
    - _Requirements: 7.1_

  - [ ] 12.2 Create data transformation script
    - Create `migration/transform-data.js`
    - Create UUID to ObjectId mapping
    - Transform all models to MongoDB document format
    - Convert foreign keys to ObjectId references
    - Embed TestCaseResults within Submissions
    - Preserve all field values and timestamps
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ] 12.3 Create MongoDB import script
    - Create `migration/import-to-mongodb.js`
    - Connect to MongoDB
    - Clear existing collections (with caution)
    - Import transformed data in correct order (users first, then problems, etc.)
    - Log import progress and counts
    - _Requirements: 7.1_

  - [ ] 12.4 Create migration validation script
    - Create `migration/validate-migration.js`
    - Verify record counts match source database
    - Validate referential integrity (all ObjectId references exist)
    - Validate schema conformance for all documents
    - Compare sample records between source and target
    - Generate validation report
    - _Requirements: 7.3, 7.5_

  - [ ] 12.5 Create backup and rollback mechanism
    - Create `migration/rollback.js`
    - Implement backup creation before migration
    - Implement rollback function to restore from backup
    - Add rollback trigger on validation failure
    - _Requirements: 7.6_

  - [ ] 12.6 Create main migration orchestration script
    - Create `migration/migrate.js`
    - Orchestrate all migration phases: backup, export, transform, import, validate
    - Handle errors and trigger rollback on failure
    - Generate comprehensive migration report
    - _Requirements: 7.1, 7.6, 7.7_

  - [ ]* 12.7 Write property test for migration data completeness
    - **Property 22: Migration Data Completeness**
    - **Validates: Requirements 7.1**
    - Export sample data from Prisma
    - Run migration
    - Verify all records exist in MongoDB
    - Run on test dataset

  - [ ]* 12.8 Write property test for migration referential integrity
    - **Property 23: Migration Referential Integrity**
    - **Validates: Requirements 7.2, 7.3**
    - Verify all foreign keys converted to valid ObjectId references
    - Verify all referenced documents exist
    - Run on test dataset

  - [ ] 12.9 Test migration on development database
    - Run migration script on development database
    - Validate migration results
    - Test application with migrated data
    - Document any issues and resolutions
    - _Requirements: 7.1, 7.5_

- [ ] 13. Checkpoint - Verify migration success
  - Confirm all data migrated correctly
  - Verify application works with migrated data
  - Test all API endpoints with real data
  - Ask the user if questions arise

- [ ] 14. Phase 10: Cleanup and Finalization (Day 8)
  - [ ] 14.1 Remove Prisma dependencies and files
    - Remove `@prisma/client` from package.json
    - Remove `prisma` from devDependencies
    - Delete `prisma/` directory (schema.prisma and migrations)
    - Remove Prisma scripts from package.json (generate, migrate, studio)
    - Remove all remaining Prisma imports from codebase
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 14.2 Update Docker configuration
    - Update docker-compose.yml to use MongoDB service instead of PostgreSQL
    - Update Dockerfile if needed for MongoDB connection
    - Update environment variables in Docker configuration
    - Test Docker setup with MongoDB
    - _Requirements: 8.7_

  - [ ] 14.3 Update documentation
    - Update README with MongoDB setup instructions
    - Document Mongoose schema structure
    - Document migration process and scripts
    - Update API documentation if needed
    - Document any Prisma features that couldn't be replicated
    - _Requirements: 6.8_

  - [ ] 14.4 Performance optimization review
    - Verify all indexes are created and used
    - Add lean() to read-only queries
    - Review populate usage and optimize field selection
    - Test query performance with explain()
    - Benchmark critical queries
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 14.5 Final integration testing
    - Run complete test suite (unit + property + integration)
    - Test all API endpoints manually
    - Verify error handling across all scenarios
    - Test with production-like data volume
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 14.6 Code review and cleanup
    - Review all controller code for consistency
    - Remove any commented-out Prisma code
    - Ensure consistent error handling patterns
    - Verify all TODOs are addressed
    - Run linter and fix issues

- [ ] 15. Final checkpoint - Migration complete
  - Ensure all tests pass
  - Verify application is production-ready
  - Confirm all Prisma code removed
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the migration
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The migration follows an 8-day timeline with clear phases
- All controllers must maintain identical API behavior after migration
- Error handling must preserve the same response format and status codes
- Data migration includes validation and rollback mechanisms for safety
