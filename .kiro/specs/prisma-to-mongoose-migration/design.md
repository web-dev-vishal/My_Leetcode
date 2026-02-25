# Design Document: Prisma to Mongoose Migration

## Overview

This design document outlines the technical approach for migrating a LeetCode clone backend from Prisma ORM with PostgreSQL to MongoDB with Mongoose. The migration preserves all existing functionality while adapting to MongoDB's document-oriented paradigm.

### Current State

The application currently uses:
- Prisma Client with PostgreSQL as the database
- UUID-based primary keys
- Relational data model with foreign key constraints
- Prisma's type-safe query API
- Auto-generated timestamps with @updatedAt
- Enum types for UserRole and Difficulty

### Target State

The migrated application will use:
- Mongoose ODM with MongoDB
- ObjectId-based primary keys
- Document-oriented data model with references and selective embedding
- Mongoose's schema-based query API
- Mongoose timestamps option for automatic timestamp management
- String-based enums validated through Mongoose schema

### Migration Scope

The migration affects:
- 9 Prisma models → 9 Mongoose schemas
- 5 controller files with database operations
- 1 database connection file (src/lib/db.js)
- Package dependencies and Docker configuration
- Data migration from PostgreSQL to MongoDB

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Express Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Auth      │  │   Problem    │  │  Submission  │      │
│  │  Controller  │  │  Controller  │  │  Controller  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Mongoose ODM  │                        │
│                    └───────┬────────┘                        │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   MongoDB Atlas  │
                    │   or Local DB    │
                    └──────────────────┘
```

### Data Model Transition Strategy

**Relationship Handling Approach:**

1. **References (Most Relations)**: Use ObjectId references for:
   - User → Submissions (one-to-many)
   - User → Problems (one-to-many)
   - User → Playlists (one-to-many)
   - Problem → Submissions (one-to-many)
   - User ↔ Problem (many-to-many via ProblemSolved)
   - Playlist ↔ Problem (many-to-many via ProblemInPlaylist)

2. **Embedding (Specific Case)**: Embed TestCaseResult within Submission
   - Rationale: TestCaseResults are always accessed with their parent Submission
   - Never queried independently
   - Reduces query complexity and improves performance

### Connection Management

**Mongoose Connection Strategy:**
- Single connection instance exported from src/lib/db.js
- Connection pooling handled automatically by Mongoose
- Graceful shutdown on application termination
- Connection retry logic for resilience

## Components and Interfaces

### Mongoose Schema Definitions

#### 1. User Schema

```javascript
// src/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  image: {
    type: String,
  },
  role: {
    type: String,
    enum: ['ADMIN', 'USER'],
    default: 'USER',
  },
  password: {
    type: String,
    required: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ email: 1 }); // Unique index already created

export const User = mongoose.model('User', userSchema);
```

#### 2. TokenBlacklist Schema

```javascript
// src/models/TokenBlacklist.js
import mongoose from 'mongoose';

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// TTL index to automatically delete expired tokens
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
```

#### 3. Problem Schema

```javascript
// src/models/Problem.js
import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD'],
    required: true,
  },
  tags: [{
    type: String,
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  examples: {
    type: mongoose.Schema.Types.Mixed, // JSON equivalent
    required: true,
  },
  constraints: {
    type: String,
    required: true,
  },
  hints: {
    type: String,
  },
  editorial: {
    type: String,
  },
  testCases: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  codeSnippets: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  referenceSolutions: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
problemSchema.index({ difficulty: 1 });
problemSchema.index({ userId: 1 });
problemSchema.index({ tags: 1 });

export const Problem = mongoose.model('Problem', problemSchema);
```

#### 4. Submission Schema (with Embedded TestCaseResults)

```javascript
// src/models/Submission.js
import mongoose from 'mongoose';

const testCaseResultSchema = new mongoose.Schema({
  testCase: {
    type: Number,
    required: true,
  },
  passed: {
    type: Boolean,
    required: true,
  },
  stdout: String,
  expected: {
    type: String,
    required: true,
  },
  stderr: String,
  compileOutput: String,
  status: {
    type: String,
    required: true,
  },
  memory: String,
  time: String,
}, {
  _id: true, // Keep _id for individual test case results
  timestamps: { createdAt: true, updatedAt: false },
});

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
  sourceCode: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  stdin: String,
  stdout: String,
  stderr: String,
  compileOutput: String,
  status: {
    type: String,
    required: true,
  },
  memory: String,
  time: String,
  testCases: [testCaseResultSchema], // Embedded test case results
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Indexes
submissionSchema.index({ status: 1 });
submissionSchema.index({ userId: 1 });
submissionSchema.index({ problemId: 1 });
submissionSchema.index({ userId: 1, problemId: 1 });

export const Submission = mongoose.model('Submission', submissionSchema);
```

#### 5. ProblemSolved Schema

```javascript
// src/models/ProblemSolved.js
import mongoose from 'mongoose';

const problemSolvedSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Compound unique index
problemSolvedSchema.index({ userId: 1, problemId: 1 }, { unique: true });

export const ProblemSolved = mongoose.model('ProblemSolved', problemSolvedSchema);
```

#### 6. Playlist Schema

```javascript
// src/models/Playlist.js
import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Compound unique index
playlistSchema.index({ name: 1, userId: 1 }, { unique: true });

export const Playlist = mongoose.model('Playlist', playlistSchema);
```

#### 7. ProblemInPlaylist Schema

```javascript
// src/models/ProblemInPlaylist.js
import mongoose from 'mongoose';

const problemInPlaylistSchema = new mongoose.Schema({
  playlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist',
    required: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Compound unique index
problemInPlaylistSchema.index({ playlistId: 1, problemId: 1 }, { unique: true });

export const ProblemInPlaylist = mongoose.model('ProblemInPlaylist', problemInPlaylistSchema);
```

### Database Connection Module

```javascript
// src/lib/db.js
import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/leetcode-clone';
    
    await mongoose.connect(mongoUri, {
      // Connection options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Export mongoose instance for direct access if needed
export const db = mongoose;
```

### Query Conversion Patterns

#### Pattern 1: findUnique → findOne/findById

**Prisma:**
```javascript
const user = await db.user.findUnique({ where: { id } });
const user = await db.user.findUnique({ where: { email } });
```

**Mongoose:**
```javascript
const user = await User.findById(id);
const user = await User.findOne({ email });
```

#### Pattern 2: findMany → find

**Prisma:**
```javascript
const problems = await db.problem.findMany({
  where: { difficulty: 'EASY' },
  orderBy: { createdAt: 'desc' },
  skip: 10,
  take: 20,
});
```

**Mongoose:**
```javascript
const problems = await Problem.find({ difficulty: 'EASY' })
  .sort({ createdAt: -1 })
  .skip(10)
  .limit(20);
```

#### Pattern 3: create → create/save

**Prisma:**
```javascript
const problem = await db.problem.create({
  data: {
    title,
    description,
    userId: req.user.id,
  },
});
```

**Mongoose:**
```javascript
const problem = await Problem.create({
  title,
  description,
  userId: req.user.id,
});
// OR
const problem = new Problem({ title, description, userId: req.user.id });
await problem.save();
```

#### Pattern 4: update → findByIdAndUpdate

**Prisma:**
```javascript
const problem = await db.problem.update({
  where: { id },
  data: { title, description },
});
```

**Mongoose:**
```javascript
const problem = await Problem.findByIdAndUpdate(
  id,
  { title, description },
  { new: true, runValidators: true }
);
```

#### Pattern 5: delete → findByIdAndDelete

**Prisma:**
```javascript
await db.problem.delete({ where: { id } });
```

**Mongoose:**
```javascript
await Problem.findByIdAndDelete(id);
```

#### Pattern 6: include → populate

**Prisma:**
```javascript
const problems = await db.problem.findMany({
  include: {
    solvedBy: {
      where: { userId: req.user.id },
    },
  },
});
```

**Mongoose:**
```javascript
const problems = await Problem.find();
// Then populate with match condition
const problemsWithSolved = await Problem.find().populate({
  path: 'solvedBy',
  match: { userId: req.user.id },
  model: 'ProblemSolved',
});

// Note: Need to set up virtual populate in Problem schema
```

#### Pattern 7: Nested where with some/every

**Prisma:**
```javascript
const problems = await db.problem.findMany({
  where: {
    solvedBy: {
      some: { userId: req.user.id },
    },
  },
});
```

**Mongoose:**
```javascript
// First find ProblemSolved records
const solvedRecords = await ProblemSolved.find({ userId: req.user.id });
const problemIds = solvedRecords.map(r => r.problemId);

// Then find problems
const problems = await Problem.find({ _id: { $in: problemIds } });
```

#### Pattern 8: count → countDocuments

**Prisma:**
```javascript
const count = await db.problem.count({ where: { difficulty: 'EASY' } });
```

**Mongoose:**
```javascript
const count = await Problem.countDocuments({ difficulty: 'EASY' });
```

#### Pattern 9: Transactions

**Prisma:**
```javascript
await db.$transaction([
  db.problem.create({ data: problemData }),
  db.problemSolved.create({ data: solvedData }),
]);
```

**Mongoose:**
```javascript
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  await Problem.create([problemData], { session });
  await ProblemSolved.create([solvedData], { session });
});
session.endSession();
```

## Data Models

### Entity Relationship Overview

```
User (1) ──────< (N) Problem
  │                    │
  │                    │
  │                    │
  └──< (N) Submission (N) >──┘
  │         │
  │         └──< (N) TestCaseResult [EMBEDDED]
  │
  ├──< (N) ProblemSolved >──< (N) Problem
  │
  └──< (N) Playlist
           │
           └──< (N) ProblemInPlaylist >──< (N) Problem
```

### Field Type Mappings

| Prisma Type | Mongoose Type | Notes |
|-------------|---------------|-------|
| String | String | Direct mapping |
| Int | Number | Direct mapping |
| Boolean | Boolean | Direct mapping |
| DateTime | Date | Direct mapping |
| Json | Mixed | Use Schema.Types.Mixed |
| String[] | [String] | Array of strings |
| Enum | String with enum | Validate with enum array |
| @id @default(uuid()) | ObjectId | MongoDB default |
| @unique | unique: true | Schema option |
| @default(now()) | default: Date.now | Schema option |
| @updatedAt | timestamps: true | Schema option |

### Virtual Populate Setup

To support Prisma-style includes, we need virtual populates:

```javascript
// In Problem schema
problemSchema.virtual('solvedBy', {
  ref: 'ProblemSolved',
  localField: '_id',
  foreignField: 'problemId',
});

problemSchema.virtual('submissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'problemId',
});

// Enable virtuals in JSON output
problemSchema.set('toJSON', { virtuals: true });
problemSchema.set('toObject', { virtuals: true });
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Data Type Preservation

For any document created with specific field types (String, Number, Date, Boolean, Mixed), when retrieved from MongoDB, the field types should match the original types specified in the Mongoose schema.

**Validates: Requirements 1.6**

### Property 2: Schema Validation Enforcement

For any document creation or update operation, when the data violates schema constraints (required fields, unique constraints, enum values), Mongoose should reject the operation with a validation error.

**Validates: Requirements 1.7**

### Property 3: CRUD Operation Equivalence

For any CRUD operation (create, read, update, delete) performed on any model, the Mongoose implementation should return results equivalent to what the Prisma implementation would have returned, including the same fields and values.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 4: Query Filtering Equivalence

For any query with filter conditions (where clauses), the Mongoose query should return the same set of documents that the equivalent Prisma query would have returned.

**Validates: Requirements 3.8**

### Property 5: Query Projection Consistency

For any query with field selection (select/projection), the returned documents should contain only the requested fields and no additional fields.

**Validates: Requirements 3.7, 10.3**

### Property 6: Query Ordering Preservation

For any query with sorting criteria, the Mongoose query should return documents in the same order as the equivalent Prisma query would have returned them.

**Validates: Requirements 3.9, 5.5**

### Property 7: Pagination Consistency

For any query with skip and limit parameters, the Mongoose query should return the same subset of documents that the equivalent Prisma query with skip and take would have returned.

**Validates: Requirements 3.10, 5.6**

### Property 8: Upsert Behavior Correctness

For any upsert operation (findOneAndUpdate with upsert: true), if the document exists it should be updated, and if it doesn't exist it should be created, maintaining the same behavior as Prisma's upsert.

**Validates: Requirements 3.6**

### Property 9: Reference Integrity

For any document with ObjectId references to other documents (userId, problemId, playlistId), when the document is created, the referenced documents should exist in the database.

**Validates: Requirements 4.1, 4.2, 4.3, 4.8**

### Property 10: Embedded Document Accessibility

For any Submission document with embedded TestCaseResult documents, all test case results should be accessible directly from the parent Submission document without requiring a separate query.

**Validates: Requirements 4.4**

### Property 11: Populate Equivalence

For any query using populate to load related documents, the result should contain the same related data that Prisma's include would have loaded.

**Validates: Requirements 4.6**

### Property 12: Relationship Creation Correctness

For any operation that creates relationships between documents (e.g., creating a submission for a user and problem), the relationship should be established correctly with valid ObjectId references.

**Validates: Requirements 4.7**

### Property 13: API Response Structure Preservation

For any API endpoint call, the JSON response structure (field names, nesting, data types) should match the structure returned by the Prisma implementation.

**Validates: Requirements 5.1**

### Property 14: HTTP Status Code Consistency

For any API operation (success or error), the HTTP status code returned should match what the Prisma implementation would have returned for the same operation.

**Validates: Requirements 5.2**

### Property 15: Validation Logic Preservation

For any request with invalid payload data, the validation errors returned should match the validation errors that the Prisma implementation would have returned.

**Validates: Requirements 5.3, 5.7**

### Property 16: Transaction Atomicity

For any set of operations wrapped in a transaction, either all operations should succeed and be committed, or all operations should fail and be rolled back, with no partial state changes persisted.

**Validates: Requirements 6.1**

### Property 17: Connect-or-Create Idempotence

For any connect-or-create operation, if the document exists it should be connected (referenced), and if it doesn't exist it should be created then connected, resulting in a valid reference either way.

**Validates: Requirements 6.2**

### Property 18: Nested Write Equivalence

For any nested write operation (creating a document with related documents), the final state should match what Prisma's nested write would have produced, with all documents created and relationships established.

**Validates: Requirements 6.3**

### Property 19: Aggregation Result Equivalence

For any aggregation operation (count, sum, average, group by), the Mongoose aggregation pipeline should return the same results as the equivalent Prisma aggregation.

**Validates: Requirements 6.4, 6.5**

### Property 20: Automatic Timestamp Management

For any document with timestamps enabled, when created, both createdAt and updatedAt should be set automatically, and when updated, only updatedAt should be modified.

**Validates: Requirements 6.6**

### Property 21: ID Generation Consistency

For any newly created document, a unique ObjectId should be automatically generated and assigned as the _id field.

**Validates: Requirements 6.7**

### Property 22: Migration Data Completeness

For any record in the source Prisma database, after migration, an equivalent document should exist in MongoDB with all field values preserved.

**Validates: Requirements 7.1**

### Property 23: Migration Referential Integrity

For any foreign key relationship in the Prisma database, after migration to ObjectId references, the referenced document should exist in MongoDB and the reference should be valid.

**Validates: Requirements 7.2, 7.3**

### Property 24: Migration Schema Conformance

For any document migrated to MongoDB, the document should pass Mongoose schema validation for its corresponding model.

**Validates: Requirements 7.5**

### Property 25: Validation Error Handling

For any Mongoose validation error, the controller should return a 400 status code with error details in the response body.

**Validates: Requirements 9.1**

### Property 26: Cast Error Handling

For any invalid ObjectId provided in a request (causing a CastError), the controller should return a 400 status code with an appropriate error message.

**Validates: Requirements 9.2**

### Property 27: Duplicate Key Error Handling

For any operation that violates a unique constraint (E11000 error), the controller should return a 409 status code indicating the conflict.

**Validates: Requirements 9.3**

### Property 28: Not Found Error Handling

For any query for a document that doesn't exist, the controller should return a 404 status code, consistent with the Prisma implementation.

**Validates: Requirements 9.4**

### Property 29: Error Response Format Consistency

For any error response, the response format (message, statusCode, details fields) should match the format used by the Prisma implementation.

**Validates: Requirements 9.5, 9.6**

### Property 30: Populate Field Selection

For any populate operation with field selection, only the specified fields from the related documents should be included in the result.

**Validates: Requirements 10.4**

## Error Handling

### Mongoose Error Types and Handling Strategy

#### 1. ValidationError
**Cause:** Document fails schema validation (required fields, enum values, custom validators)

**Handling:**
```javascript
if (error.name === 'ValidationError') {
  return res.status(400).json({
    error: 'Validation failed',
    details: Object.values(error.errors).map(e => ({
      field: e.path,
      message: e.message,
    })),
  });
}
```

#### 2. CastError
**Cause:** Invalid ObjectId format or type casting failure

**Handling:**
```javascript
if (error.name === 'CastError') {
  return res.status(400).json({
    error: `Invalid ${error.path}: ${error.value}`,
  });
}
```

#### 3. MongoServerError (Code 11000)
**Cause:** Duplicate key violation on unique index

**Handling:**
```javascript
if (error.code === 11000) {
  const field = Object.keys(error.keyPattern)[0];
  return res.status(409).json({
    error: `Duplicate value for ${field}`,
    field,
  });
}
```

#### 4. DocumentNotFoundError
**Cause:** findByIdAndUpdate/Delete returns null

**Handling:**
```javascript
if (!document) {
  return res.status(404).json({
    error: 'Resource not found',
  });
}
```

#### 5. Connection Errors
**Cause:** MongoDB connection issues

**Handling:**
```javascript
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  // Implement retry logic or circuit breaker
});
```

### Centralized Error Handler Middleware

```javascript
// src/middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: `Duplicate value for ${field}`,
      field,
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
  });
};
```

### Error Handling in Controllers

**Pattern for all controller methods:**

```javascript
export const controllerMethod = async (req, res, next) => {
  try {
    // Controller logic here
    
    // Check for not found
    if (!document) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    res.status(200).json({ success: true, data: document });
  } catch (error) {
    next(error); // Pass to centralized error handler
  }
};
```

## Testing Strategy

### Dual Testing Approach

The migration requires both unit tests and property-based tests to ensure comprehensive correctness:

**Unit Tests** focus on:
- Specific examples of CRUD operations
- Edge cases (empty arrays, null values, boundary conditions)
- Error conditions (invalid IDs, missing required fields)
- Integration points (database connection, middleware)
- Migration script specific scenarios

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- CRUD operation equivalence across random data
- Query filtering and sorting correctness
- Relationship integrity across random associations
- Error handling consistency across various error types

### Property-Based Testing Configuration

**Library Selection:** Use `fast-check` for JavaScript/Node.js property-based testing

**Installation:**
```bash
npm install --save-dev fast-check
```

**Configuration:**
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: prisma-to-mongoose-migration, Property {number}: {property_text}`

### Test Organization

```
tests/
├── unit/
│   ├── models/
│   │   ├── user.test.js
│   │   ├── problem.test.js
│   │   ├── submission.test.js
│   │   └── ...
│   ├── controllers/
│   │   ├── auth.test.js
│   │   ├── problem.test.js
│   │   └── ...
│   └── lib/
│       └── db.test.js
├── property/
│   ├── crud-operations.property.test.js
│   ├── query-operations.property.test.js
│   ├── relationships.property.test.js
│   ├── error-handling.property.test.js
│   └── migration.property.test.js
└── integration/
    ├── api-endpoints.test.js
    └── migration-script.test.js
```

### Example Property-Based Test

```javascript
// tests/property/crud-operations.property.test.js
import fc from 'fast-check';
import { User } from '../../src/models/User.js';
import { connectDB } from '../../src/lib/db.js';

describe('Property Tests: CRUD Operations', () => {
  beforeAll(async () => {
    await connectDB();
  });

  // Feature: prisma-to-mongoose-migration, Property 3: CRUD Operation Equivalence
  test('Property 3: Create then read returns equivalent document', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8 }),
          role: fc.constantFrom('USER', 'ADMIN'),
        }),
        async (userData) => {
          // Create document
          const created = await User.create(userData);
          
          // Read document
          const retrieved = await User.findById(created._id);
          
          // Verify equivalence
          expect(retrieved.name).toBe(created.name);
          expect(retrieved.email).toBe(created.email);
          expect(retrieved.role).toBe(created.role);
          
          // Cleanup
          await User.findByIdAndDelete(created._id);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: prisma-to-mongoose-migration, Property 4: Query Filtering Equivalence
  test('Property 4: Filtering returns only matching documents', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('USER', 'ADMIN'),
        async (targetRole) => {
          // Query by role
          const users = await User.find({ role: targetRole });
          
          // Verify all returned users have the target role
          users.forEach(user => {
            expect(user.role).toBe(targetRole);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Example Unit Test

```javascript
// tests/unit/models/user.test.js
import { User } from '../../src/models/User.js';
import { connectDB } from '../../src/lib/db.js';

describe('User Model', () => {
  beforeAll(async () => {
    await connectDB();
  });

  test('should create a user with default role', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
    };
    
    const user = await User.create(userData);
    
    expect(user.role).toBe('USER');
    expect(user.email).toBe('test@example.com');
    
    await User.findByIdAndDelete(user._id);
  });

  test('should enforce unique email constraint', async () => {
    const userData = {
      email: 'duplicate@example.com',
      password: 'password123',
    };
    
    await User.create(userData);
    
    await expect(User.create(userData)).rejects.toThrow();
    
    await User.deleteOne({ email: userData.email });
  });

  test('should require email field', async () => {
    const userData = {
      password: 'password123',
    };
    
    await expect(User.create(userData)).rejects.toThrow(/email/);
  });
});
```

### Migration Testing Strategy

**Pre-Migration Validation:**
1. Export Prisma database schema and data
2. Count records in each table
3. Verify referential integrity in source database

**Post-Migration Validation:**
1. Count documents in each MongoDB collection
2. Verify all ObjectId references are valid
3. Run schema validation on all documents
4. Compare sample records between source and target
5. Run property-based tests on migrated data

**Migration Test Script:**
```javascript
// tests/integration/migration-script.test.js
describe('Migration Script', () => {
  test('should preserve record counts', async () => {
    const prismaCounts = {
      users: 100,
      problems: 50,
      submissions: 500,
    };
    
    // Run migration
    await runMigration();
    
    // Verify counts
    expect(await User.countDocuments()).toBe(prismaCounts.users);
    expect(await Problem.countDocuments()).toBe(prismaCounts.problems);
    expect(await Submission.countDocuments()).toBe(prismaCounts.submissions);
  });

  test('should maintain referential integrity', async () => {
    const submissions = await Submission.find();
    
    for (const submission of submissions) {
      const user = await User.findById(submission.userId);
      const problem = await Problem.findById(submission.problemId);
      
      expect(user).toBeTruthy();
      expect(problem).toBeTruthy();
    }
  });
});
```

### Performance Testing

**Benchmark Queries:**
- Compare query execution time before and after migration
- Test with various dataset sizes (100, 1000, 10000 records)
- Measure populate vs. manual join performance
- Verify index usage with explain()

**Performance Test Example:**
```javascript
test('should maintain query performance', async () => {
  const start = Date.now();
  
  const problems = await Problem.find({ difficulty: 'EASY' })
    .sort({ createdAt: -1 })
    .limit(20);
  
  const duration = Date.now() - start;
  
  expect(duration).toBeLessThan(100); // Should complete in <100ms
  expect(problems).toHaveLength(20);
});
```

### Test Coverage Goals

- Unit test coverage: >80% of controller and model code
- Property test coverage: All 30 correctness properties
- Integration test coverage: All API endpoints
- Migration test coverage: All data transformation logic

### Continuous Testing

**Pre-commit hooks:**
- Run unit tests
- Run linting and type checking

**CI/CD pipeline:**
- Run full test suite (unit + property + integration)
- Run migration tests on sample dataset
- Generate coverage reports
- Performance regression tests


## Migration Script Design

### Migration Script Architecture

```
migration/
├── export-prisma-data.js      # Export data from Prisma/PostgreSQL
├── transform-data.js           # Transform IDs and structure
├── import-to-mongodb.js        # Import to MongoDB
├── validate-migration.js       # Verify migration success
└── rollback.js                 # Rollback mechanism
```

### Phase 1: Data Export

```javascript
// migration/export-prisma-data.js
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

export async function exportPrismaData() {
  console.log('Starting Prisma data export...');
  
  const data = {
    users: await prisma.user.findMany(),
    tokenBlacklist: await prisma.tokenBlacklist.findMany(),
    problems: await prisma.problem.findMany(),
    submissions: await prisma.submission.findMany(),
    testCaseResults: await prisma.testCaseResult.findMany(),
    problemsSolved: await prisma.problemSolved.findMany(),
    playlists: await prisma.playlist.findMany(),
    problemsInPlaylists: await prisma.problemInPlaylist.findMany(),
  };
  
  // Save to JSON file
  await fs.writeFile(
    'migration/prisma-export.json',
    JSON.stringify(data, null, 2)
  );
  
  console.log('Export complete:');
  console.log(`- Users: ${data.users.length}`);
  console.log(`- Problems: ${data.problems.length}`);
  console.log(`- Submissions: ${data.submissions.length}`);
  console.log(`- Test Case Results: ${data.testCaseResults.length}`);
  
  return data;
}
```

### Phase 2: Data Transformation

```javascript
// migration/transform-data.js
import { ObjectId } from 'mongodb';

export function transformData(prismaData) {
  console.log('Starting data transformation...');
  
  // Create ID mapping: UUID -> ObjectId
  const idMap = new Map();
  
  // Generate ObjectIds for all entities
  ['users', 'problems', 'submissions', 'playlists', 'problemsSolved', 'problemsInPlaylists']
    .forEach(collection => {
      prismaData[collection].forEach(item => {
        if (!idMap.has(item.id)) {
          idMap.set(item.id, new ObjectId());
        }
      });
    });
  
  // Transform users
  const users = prismaData.users.map(user => ({
    _id: idMap.get(user.id),
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    password: user.password,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
  
  // Transform problems
  const problems = prismaData.problems.map(problem => ({
    _id: idMap.get(problem.id),
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    tags: problem.tags,
    userId: idMap.get(problem.userId),
    examples: problem.examples,
    constraints: problem.constraints,
    hints: problem.hints,
    editorial: problem.editorial,
    testCases: problem.testCases,
    codeSnippets: problem.codeSnippets,
    referenceSolutions: problem.referenceSolutions,
    createdAt: problem.createdAt,
    updatedAt: problem.updatedAt,
  }));
  
  // Group test case results by submission
  const testCasesBySubmission = new Map();
  prismaData.testCaseResults.forEach(tc => {
    if (!testCasesBySubmission.has(tc.submissionId)) {
      testCasesBySubmission.set(tc.submissionId, []);
    }
    testCasesBySubmission.get(tc.submissionId).push({
      _id: new ObjectId(), // New ID for embedded document
      testCase: tc.testCase,
      passed: tc.passed,
      stdout: tc.stdout,
      expected: tc.expected,
      stderr: tc.stderr,
      compileOutput: tc.compileOutput,
      status: tc.status,
      memory: tc.memory,
      time: tc.time,
      createdAt: tc.createdAt,
    });
  });
  
  // Transform submissions with embedded test cases
  const submissions = prismaData.submissions.map(submission => ({
    _id: idMap.get(submission.id),
    userId: idMap.get(submission.userId),
    problemId: idMap.get(submission.problemId),
    sourceCode: submission.sourceCode,
    language: submission.language,
    stdin: submission.stdin,
    stdout: submission.stdout,
    stderr: submission.stderr,
    compileOutput: submission.compileOutput,
    status: submission.status,
    memory: submission.memory,
    time: submission.time,
    testCases: testCasesBySubmission.get(submission.id) || [],
    createdAt: submission.createdAt,
  }));
  
  // Transform problemsSolved
  const problemsSolved = prismaData.problemsSolved.map(ps => ({
    _id: idMap.get(ps.id),
    userId: idMap.get(ps.userId),
    problemId: idMap.get(ps.problemId),
    createdAt: ps.createdAt,
  }));
  
  // Transform playlists
  const playlists = prismaData.playlists.map(playlist => ({
    _id: idMap.get(playlist.id),
    name: playlist.name,
    description: playlist.description,
    userId: idMap.get(playlist.userId),
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  }));
  
  // Transform problemsInPlaylists
  const problemsInPlaylists = prismaData.problemsInPlaylists.map(pip => ({
    _id: idMap.get(pip.id),
    playlistId: idMap.get(pip.playlistId),
    problemId: idMap.get(pip.problemId),
    createdAt: pip.createdAt,
  }));
  
  // Transform token blacklist
  const tokenBlacklist = prismaData.tokenBlacklist.map(token => ({
    _id: new ObjectId(),
    token: token.token,
    expiresAt: token.expiresAt,
    createdAt: token.createdAt,
  }));
  
  console.log('Transformation complete');
  
  return {
    users,
    problems,
    submissions,
    problemsSolved,
    playlists,
    problemsInPlaylists,
    tokenBlacklist,
    idMap, // Return for validation
  };
}
```

### Phase 3: MongoDB Import

```javascript
// migration/import-to-mongodb.js
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Problem } from '../src/models/Problem.js';
import { Submission } from '../src/models/Submission.js';
import { ProblemSolved } from '../src/models/ProblemSolved.js';
import { Playlist } from '../src/models/Playlist.js';
import { ProblemInPlaylist } from '../src/models/ProblemInPlaylist.js';
import { TokenBlacklist } from '../src/models/TokenBlacklist.js';

export async function importToMongoDB(transformedData) {
  console.log('Starting MongoDB import...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data (CAUTION: Only for migration)
    await Promise.all([
      User.deleteMany({}),
      Problem.deleteMany({}),
      Submission.deleteMany({}),
      ProblemSolved.deleteMany({}),
      Playlist.deleteMany({}),
      ProblemInPlaylist.deleteMany({}),
      TokenBlacklist.deleteMany({}),
    ]);
    console.log('Cleared existing collections');
    
    // Import in order to maintain referential integrity
    await User.insertMany(transformedData.users);
    console.log(`Imported ${transformedData.users.length} users`);
    
    await TokenBlacklist.insertMany(transformedData.tokenBlacklist);
    console.log(`Imported ${transformedData.tokenBlacklist.length} tokens`);
    
    await Problem.insertMany(transformedData.problems);
    console.log(`Imported ${transformedData.problems.length} problems`);
    
    await Submission.insertMany(transformedData.submissions);
    console.log(`Imported ${transformedData.submissions.length} submissions`);
    
    await ProblemSolved.insertMany(transformedData.problemsSolved);
    console.log(`Imported ${transformedData.problemsSolved.length} problem solved records`);
    
    await Playlist.insertMany(transformedData.playlists);
    console.log(`Imported ${transformedData.playlists.length} playlists`);
    
    await ProblemInPlaylist.insertMany(transformedData.problemsInPlaylists);
    console.log(`Imported ${transformedData.problemsInPlaylists.length} playlist items`);
    
    console.log('MongoDB import complete');
    
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}
```

### Phase 4: Validation

```javascript
// migration/validate-migration.js
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Problem } from '../src/models/Problem.js';
import { Submission } from '../src/models/Submission.js';

export async function validateMigration(originalData, transformedData) {
  console.log('Starting migration validation...');
  
  const errors = [];
  
  // Validate record counts
  const counts = {
    users: await User.countDocuments(),
    problems: await Problem.countDocuments(),
    submissions: await Submission.countDocuments(),
  };
  
  if (counts.users !== originalData.users.length) {
    errors.push(`User count mismatch: expected ${originalData.users.length}, got ${counts.users}`);
  }
  
  if (counts.problems !== originalData.problems.length) {
    errors.push(`Problem count mismatch: expected ${originalData.problems.length}, got ${counts.problems}`);
  }
  
  if (counts.submissions !== originalData.submissions.length) {
    errors.push(`Submission count mismatch: expected ${originalData.submissions.length}, got ${counts.submissions}`);
  }
  
  // Validate referential integrity
  const submissions = await Submission.find().limit(100);
  for (const submission of submissions) {
    const user = await User.findById(submission.userId);
    if (!user) {
      errors.push(`Submission ${submission._id} references non-existent user ${submission.userId}`);
    }
    
    const problem = await Problem.findById(submission.problemId);
    if (!problem) {
      errors.push(`Submission ${submission._id} references non-existent problem ${submission.problemId}`);
    }
  }
  
  // Validate embedded test cases
  const submissionsWithTests = await Submission.find({ 'testCases.0': { $exists: true } }).limit(10);
  for (const submission of submissionsWithTests) {
    if (!Array.isArray(submission.testCases)) {
      errors.push(`Submission ${submission._id} has invalid testCases structure`);
    }
  }
  
  // Validate schema conformance
  try {
    const sampleUser = await User.findOne();
    await sampleUser.validate();
    
    const sampleProblem = await Problem.findOne();
    await sampleProblem.validate();
  } catch (error) {
    errors.push(`Schema validation failed: ${error.message}`);
  }
  
  if (errors.length > 0) {
    console.error('Validation failed with errors:');
    errors.forEach(err => console.error(`- ${err}`));
    return false;
  }
  
  console.log('Validation successful!');
  return true;
}
```

### Phase 5: Rollback Mechanism

```javascript
// migration/rollback.js
import fs from 'fs/promises';
import mongoose from 'mongoose';

export async function createBackup() {
  console.log('Creating backup...');
  
  const backup = {
    timestamp: new Date().toISOString(),
    collections: {},
  };
  
  const collections = mongoose.connection.collections;
  
  for (const [name, collection] of Object.entries(collections)) {
    backup.collections[name] = await collection.find({}).toArray();
  }
  
  await fs.writeFile(
    `migration/backup-${backup.timestamp}.json`,
    JSON.stringify(backup, null, 2)
  );
  
  console.log(`Backup created: backup-${backup.timestamp}.json`);
  return backup;
}

export async function rollback(backupFile) {
  console.log(`Rolling back to ${backupFile}...`);
  
  const backupData = JSON.parse(await fs.readFile(backupFile, 'utf-8'));
  
  // Clear current data
  const collections = mongoose.connection.collections;
  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
  
  // Restore backup
  for (const [name, documents] of Object.entries(backupData.collections)) {
    if (documents.length > 0) {
      await mongoose.connection.collection(name).insertMany(documents);
      console.log(`Restored ${documents.length} documents to ${name}`);
    }
  }
  
  console.log('Rollback complete');
}
```

### Main Migration Script

```javascript
// migration/migrate.js
import { exportPrismaData } from './export-prisma-data.js';
import { transformData } from './transform-data.js';
import { importToMongoDB } from './import-to-mongodb.js';
import { validateMigration } from './validate-migration.js';
import { createBackup, rollback } from './rollback.js';

async function runMigration() {
  console.log('=== Starting Prisma to Mongoose Migration ===\n');
  
  try {
    // Step 1: Create backup of current MongoDB (if exists)
    console.log('Step 1: Creating backup...');
    const backup = await createBackup();
    
    // Step 2: Export Prisma data
    console.log('\nStep 2: Exporting Prisma data...');
    const prismaData = await exportPrismaData();
    
    // Step 3: Transform data
    console.log('\nStep 3: Transforming data...');
    const transformedData = transformData(prismaData);
    
    // Step 4: Import to MongoDB
    console.log('\nStep 4: Importing to MongoDB...');
    await importToMongoDB(transformedData);
    
    // Step 5: Validate migration
    console.log('\nStep 5: Validating migration...');
    const isValid = await validateMigration(prismaData, transformedData);
    
    if (!isValid) {
      console.error('\nMigration validation failed. Rolling back...');
      await rollback(`migration/backup-${backup.timestamp}.json`);
      process.exit(1);
    }
    
    console.log('\n=== Migration completed successfully! ===');
    console.log('\nNext steps:');
    console.log('1. Test the application thoroughly');
    console.log('2. Run property-based tests');
    console.log('3. Compare API responses with Prisma version');
    console.log('4. If everything works, remove Prisma dependencies');
    
  } catch (error) {
    console.error('\nMigration failed:', error);
    console.log('Check logs and consider rolling back');
    process.exit(1);
  }
}

// Run migration
runMigration();
```

## Implementation Guidance

### Step-by-Step Implementation Plan

#### Phase 1: Setup (Day 1)
1. Install Mongoose: `npm install mongoose`
2. Create models directory: `src/models/`
3. Create all Mongoose schema files
4. Update src/lib/db.js with Mongoose connection
5. Add MongoDB connection string to .env

#### Phase 2: Controller Migration (Days 2-4)
1. Start with simplest controller (auth.controller.js)
2. Replace Prisma imports with Mongoose model imports
3. Convert each query operation using patterns from this design
4. Add error handling for Mongoose errors
5. Test each endpoint manually
6. Repeat for remaining controllers

#### Phase 3: Testing (Days 5-6)
1. Write unit tests for each model
2. Write unit tests for each controller method
3. Write property-based tests for correctness properties
4. Run full test suite and fix issues

#### Phase 4: Data Migration (Day 7)
1. Create migration scripts
2. Test migration on development database
3. Validate migrated data
4. Document migration process

#### Phase 5: Cleanup (Day 8)
1. Remove Prisma dependencies
2. Remove Prisma schema and migrations
3. Update Docker configuration
4. Update documentation
5. Final testing

### Controller Conversion Checklist

For each controller file:
- [ ] Replace `import { db } from '../lib/db.js'` with model imports
- [ ] Convert all `db.model.findUnique` to `Model.findById` or `Model.findOne`
- [ ] Convert all `db.model.findMany` to `Model.find`
- [ ] Convert all `db.model.create` to `Model.create`
- [ ] Convert all `db.model.update` to `Model.findByIdAndUpdate`
- [ ] Convert all `db.model.delete` to `Model.findByIdAndDelete`
- [ ] Convert all `include` to `populate`
- [ ] Add Mongoose error handling
- [ ] Test all endpoints
- [ ] Write unit tests
- [ ] Write property tests

### Common Pitfalls and Solutions

#### Pitfall 1: Forgetting `new: true` in updates
**Problem:** `findByIdAndUpdate` returns the old document by default

**Solution:**
```javascript
const updated = await Model.findByIdAndUpdate(
  id,
  updateData,
  { new: true, runValidators: true }
);
```

#### Pitfall 2: Not handling null from findById
**Problem:** Mongoose returns null if document not found, not an error

**Solution:**
```javascript
const doc = await Model.findById(id);
if (!doc) {
  return res.status(404).json({ error: 'Not found' });
}
```

#### Pitfall 3: Populate not loading data
**Problem:** Virtual populates need to be configured in schema

**Solution:**
```javascript
// In schema definition
schema.virtual('fieldName', {
  ref: 'ModelName',
  localField: '_id',
  foreignField: 'referenceField',
});
```

#### Pitfall 4: Unique constraint on nullable field
**Problem:** Multiple null values violate unique constraint

**Solution:**
```javascript
// Use sparse index
fieldName: {
  type: String,
  unique: true,
  sparse: true, // Allows multiple null values
}
```

#### Pitfall 5: Embedded documents not validating
**Problem:** Embedded schemas don't validate by default on update

**Solution:**
```javascript
await Model.findByIdAndUpdate(
  id,
  updateData,
  { runValidators: true } // Enable validation
);
```

### Performance Optimization Tips

1. **Use lean() for read-only queries:**
```javascript
const problems = await Problem.find().lean(); // Returns plain JS objects
```

2. **Select only needed fields:**
```javascript
const users = await User.find().select('name email'); // Only return name and email
```

3. **Use indexes for frequent queries:**
```javascript
schema.index({ userId: 1, problemId: 1 }); // Compound index
```

4. **Batch operations when possible:**
```javascript
await Model.insertMany(documents); // Faster than multiple creates
```

5. **Use aggregation for complex queries:**
```javascript
const stats = await Problem.aggregate([
  { $match: { difficulty: 'EASY' } },
  { $group: { _id: '$userId', count: { $sum: 1 } } },
]);
```

### Monitoring and Observability

**Add query logging:**
```javascript
mongoose.set('debug', process.env.NODE_ENV === 'development');
```

**Monitor slow queries:**
```javascript
mongoose.connection.on('query', (query) => {
  if (query.duration > 100) {
    console.warn('Slow query detected:', query);
  }
});
```

**Track connection pool:**
```javascript
setInterval(() => {
  const pool = mongoose.connection.client.topology;
  console.log('Connection pool:', {
    available: pool.s.pool.availableConnections,
    inUse: pool.s.pool.inUseConnections,
  });
}, 60000);
```

## Conclusion

This design document provides a comprehensive blueprint for migrating from Prisma to Mongoose. The migration preserves all existing functionality while adapting to MongoDB's document-oriented paradigm. Key aspects include:

- **Schema Design:** All 9 Prisma models converted to Mongoose schemas with appropriate data types and validation
- **Query Patterns:** Comprehensive mapping of Prisma operations to Mongoose equivalents
- **Relationship Strategy:** Mix of references and embedding based on access patterns
- **Error Handling:** Mongoose-specific error handling maintaining API compatibility
- **Testing Strategy:** Dual approach with unit tests and property-based tests for 30 correctness properties
- **Migration Script:** Multi-phase migration with validation and rollback capabilities
- **Implementation Guidance:** Step-by-step plan with common pitfalls and solutions

The migration can be completed in approximately 8 days following the phased implementation plan, with thorough testing ensuring no functionality is lost during the transition.
