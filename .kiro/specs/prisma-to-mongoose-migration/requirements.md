# Requirements Document

## Introduction

This document specifies the requirements for migrating a LeetCode clone backend from Prisma ORM to MongoDB with Mongoose. The migration must preserve all existing functionality while adapting to MongoDB's document-oriented paradigm and Mongoose's API patterns. The system currently uses Prisma with a relational database approach and must transition to Mongoose while maintaining data integrity, relationships, and query capabilities.

## Glossary

- **Backend_Application**: The Node.js Express server that handles API requests for the LeetCode clone
- **Prisma_Client**: The current ORM client used for database operations
- **Mongoose**: The MongoDB object modeling library that will replace Prisma
- **Schema**: A Mongoose schema definition that replaces a Prisma model
- **Controller**: Express route handler functions in src/controllers/ that perform database operations
- **Database_Connection**: The MongoDB connection managed by Mongoose in src/lib/db.js
- **User**: A registered user entity with authentication credentials and profile information
- **Problem**: A coding challenge entity with description, difficulty, and test cases
- **Submission**: A user's code submission attempt for a specific problem
- **Test_Case**: Input/output pairs used to validate problem submissions
- **Playlist**: A collection of problems grouped together by a user
- **Relation**: A connection between entities (e.g., User has many Submissions)
- **Embedding**: Storing related data directly within a document
- **Reference**: Storing ObjectId pointers to related documents
- **Migration_Script**: Code that transforms existing data from the old schema to the new schema

## Requirements

### Requirement 1: Replace Prisma Models with Mongoose Schemas

**User Story:** As a developer, I want to convert all Prisma models to Mongoose schemas, so that the application can use MongoDB's document model.

#### Acceptance Criteria

1. THE Backend_Application SHALL define a Mongoose Schema for the User entity with fields equivalent to the current Prisma User model
2. THE Backend_Application SHALL define a Mongoose Schema for the Problem entity with fields equivalent to the current Prisma Problem model
3. THE Backend_Application SHALL define a Mongoose Schema for the Submission entity with fields equivalent to the current Prisma Submission model
4. THE Backend_Application SHALL define a Mongoose Schema for the Test_Case entity with fields equivalent to the current Prisma Test_Case model
5. THE Backend_Application SHALL define a Mongoose Schema for the Playlist entity with fields equivalent to the current Prisma Playlist model
6. THE Backend_Application SHALL use appropriate Mongoose data types that correspond to Prisma field types (String, Int, DateTime, Boolean, Json)
7. THE Backend_Application SHALL implement Mongoose schema validation rules equivalent to Prisma's @unique, @default, and optional/required constraints
8. THE Backend_Application SHALL define Mongoose schema indexes for fields that had @unique or @@index in Prisma models

### Requirement 2: Establish MongoDB Connection

**User Story:** As a developer, I want to replace the Prisma database connection with a Mongoose connection, so that the application can connect to MongoDB.

#### Acceptance Criteria

1. THE Database_Connection SHALL initialize Mongoose with a MongoDB connection string
2. WHEN the Backend_Application starts, THE Database_Connection SHALL establish a connection to MongoDB before accepting requests
3. IF the MongoDB connection fails, THEN THE Database_Connection SHALL log the error and prevent the application from starting
4. THE Database_Connection SHALL handle connection events (connected, error, disconnected) with appropriate logging
5. WHEN the Backend_Application shuts down, THE Database_Connection SHALL gracefully close the MongoDB connection
6. THE Database_Connection SHALL remove all Prisma Client initialization code from src/lib/db.js

### Requirement 3: Convert Prisma Query Operations to Mongoose

**User Story:** As a developer, I want to convert all Prisma query methods to equivalent Mongoose operations, so that controllers continue to function correctly.

#### Acceptance Criteria

1. THE Controller SHALL replace all Prisma findUnique operations with Mongoose findOne or findById operations
2. THE Controller SHALL replace all Prisma findMany operations with Mongoose find operations
3. THE Controller SHALL replace all Prisma create operations with Mongoose create or new Model + save operations
4. THE Controller SHALL replace all Prisma update operations with Mongoose findByIdAndUpdate or updateOne operations
5. THE Controller SHALL replace all Prisma delete operations with Mongoose findByIdAndDelete or deleteOne operations
6. THE Controller SHALL replace all Prisma upsert operations with Mongoose findOneAndUpdate with upsert option
7. THE Controller SHALL replace Prisma's select option with Mongoose's select method for field projection
8. THE Controller SHALL replace Prisma's where clauses with equivalent Mongoose query filter objects
9. THE Controller SHALL replace Prisma's orderBy with Mongoose's sort method
10. THE Controller SHALL replace Prisma's skip and take with Mongoose's skip and limit methods

### Requirement 4: Handle Entity Relations

**User Story:** As a developer, I want to implement appropriate relationship patterns in MongoDB, so that entity associations are maintained correctly.

#### Acceptance Criteria

1. THE Backend_Application SHALL use ObjectId references for the User-to-Submission relation (one-to-many)
2. THE Backend_Application SHALL use ObjectId references for the Problem-to-Submission relation (one-to-many)
3. THE Backend_Application SHALL use ObjectId references for the User-to-Playlist relation (one-to-many)
4. WHERE Test_Cases are always accessed with their parent Problem, THE Backend_Application SHALL embed Test_Case documents within Problem documents
5. WHERE Playlists contain Problem references, THE Backend_Application SHALL store an array of Problem ObjectIds in the Playlist schema
6. THE Controller SHALL replace Prisma's include option with Mongoose's populate method for loading related documents
7. THE Controller SHALL replace nested Prisma creates (e.g., user: { connect: { id } }) with direct ObjectId assignment
8. WHEN a Relation uses references, THE Controller SHALL validate that referenced ObjectIds exist before creating associations

### Requirement 5: Maintain Existing Functionality

**User Story:** As a developer, I want all existing API endpoints to work identically after migration, so that frontend applications are not affected.

#### Acceptance Criteria

1. THE Backend_Application SHALL return the same JSON response structures from all API endpoints after migration
2. THE Backend_Application SHALL maintain the same HTTP status codes for success and error cases
3. THE Backend_Application SHALL preserve all existing validation logic for request payloads
4. THE Backend_Application SHALL maintain the same authentication and authorization behavior
5. WHEN a query returns multiple results, THE Backend_Application SHALL return results in the same order as before migration
6. THE Backend_Application SHALL handle pagination parameters (skip, take/limit) identically to the Prisma implementation
7. THE Backend_Application SHALL maintain the same error messages for validation failures and not-found cases

### Requirement 6: Handle Prisma-Specific Features

**User Story:** As a developer, I want to understand and address Prisma features that don't have direct Mongoose equivalents, so that I can adapt the implementation appropriately.

#### Acceptance Criteria

1. WHERE Prisma uses transactions with $transaction, THE Backend_Application SHALL use Mongoose sessions with startSession and withTransaction
2. WHERE Prisma uses connectOrCreate, THE Backend_Application SHALL implement equivalent logic using findOne followed by create if not found
3. WHERE Prisma uses nested writes (creating related records in one operation), THE Backend_Application SHALL break these into separate Mongoose operations
4. WHERE Prisma uses aggregate operations, THE Backend_Application SHALL use Mongoose's aggregation pipeline
5. WHERE Prisma uses count operations, THE Backend_Application SHALL use Mongoose's countDocuments method
6. WHERE Prisma auto-generates createdAt and updatedAt with @updatedAt, THE Backend_Application SHALL use Mongoose timestamps option
7. WHERE Prisma uses @default(autoincrement()), THE Backend_Application SHALL use MongoDB's default ObjectId or implement custom counter logic if numeric IDs are required
8. THE Backend_Application SHALL document any Prisma features that cannot be directly replicated in Mongoose

### Requirement 7: Data Migration Strategy

**User Story:** As a developer, I want a strategy for migrating existing data from the current database to MongoDB, so that no data is lost during the transition.

#### Acceptance Criteria

1. THE Migration_Script SHALL export all existing data from the Prisma database in a format compatible with MongoDB import
2. THE Migration_Script SHALL transform Prisma's auto-increment IDs to MongoDB ObjectIds while preserving relationships
3. THE Migration_Script SHALL maintain referential integrity when converting foreign keys to ObjectId references
4. WHERE Test_Cases are embedded in Problems, THE Migration_Script SHALL nest Test_Case data within Problem documents
5. THE Migration_Script SHALL validate that all migrated data conforms to the new Mongoose schemas
6. THE Migration_Script SHALL provide a rollback mechanism in case migration fails
7. THE Migration_Script SHALL generate a migration report showing record counts before and after migration

### Requirement 8: Remove Prisma Dependencies

**User Story:** As a developer, I want to completely remove Prisma from the project, so that there are no conflicting dependencies or unused code.

#### Acceptance Criteria

1. THE Backend_Application SHALL remove the @prisma/client package from package.json dependencies
2. THE Backend_Application SHALL remove the prisma package from package.json devDependencies
3. THE Backend_Application SHALL remove the prisma/ directory containing schema.prisma and migrations
4. THE Backend_Application SHALL remove all Prisma-related scripts from package.json (prisma generate, prisma migrate, etc.)
5. THE Backend_Application SHALL remove all import statements for @prisma/client from controller files
6. THE Backend_Application SHALL add mongoose to package.json dependencies
7. THE Backend_Application SHALL update the Docker configuration to use MongoDB instead of the previous database

### Requirement 9: Error Handling Adaptation

**User Story:** As a developer, I want to handle Mongoose-specific errors appropriately, so that the application provides meaningful error responses.

#### Acceptance Criteria

1. WHEN a Mongoose validation error occurs, THE Controller SHALL return a 400 status code with validation details
2. WHEN a Mongoose CastError occurs (invalid ObjectId), THE Controller SHALL return a 400 status code with an appropriate message
3. WHEN a Mongoose duplicate key error occurs (E11000), THE Controller SHALL return a 409 status code indicating the conflict
4. WHEN a document is not found, THE Controller SHALL return a 404 status code consistent with the previous Prisma behavior
5. THE Controller SHALL replace Prisma error handling (PrismaClientKnownRequestError) with Mongoose error handling
6. THE Controller SHALL maintain the same error response format (message, statusCode, details) as the Prisma implementation

### Requirement 10: Query Performance Optimization

**User Story:** As a developer, I want to ensure query performance is maintained or improved after migration, so that application response times remain acceptable.

#### Acceptance Criteria

1. THE Backend_Application SHALL create Mongoose indexes on fields that are frequently queried (userId, problemId, email)
2. THE Backend_Application SHALL use lean() queries when plain JavaScript objects are sufficient (no need for Mongoose document methods)
3. WHERE Prisma used select to limit returned fields, THE Backend_Application SHALL use Mongoose select to reduce data transfer
4. THE Backend_Application SHALL use populate with select to limit fields loaded from referenced documents
5. WHERE N+1 query problems existed with Prisma includes, THE Backend_Application SHALL use populate to avoid multiple round trips
6. THE Backend_Application SHALL implement compound indexes for queries that filter on multiple fields simultaneously
