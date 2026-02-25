# Complete API Endpoints Reference

## Base URL
```
http://localhost:8080
```

## 🔐 Authentication Endpoints

### Register User
```
POST /api/v1/auth/register
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "user": {...},
  "token": "jwt_token_here"
}
```

### Login User
```
POST /api/v1/auth/login
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "user": {...},
  "token": "jwt_token_here"
}
```

### Logout User
```
POST /api/v1/auth/logout
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🤖 AI Endpoints (OpenRouter)

**All AI endpoints require JWT authentication**

### 1. Get Hint (No Code)
```
POST /api/v1/ai/hint/:problemId
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body: {}

Response:
{
  "success": true,
  "hint": "Consider using a hash map...",
  "cached": false,
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 75,
    "total_tokens": 225
  }
}
```

### 2. Get Hint (With Code)
```
POST /api/v1/ai/hint/:problemId
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body:
{
  "code": "function twoSum(nums, target) {\n  // stuck here\n}"
}

Response: Same as above
```

### 3. Explain Problem
```
GET /api/v1/ai/explain/:problemId
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "explanation": "This problem asks you to...",
  "cached": false,
  "usage": {...}
}
```

### 4. Analyze Code
```
POST /api/v1/ai/analyze/:problemId
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body:
{
  "code": "function twoSum(nums, target) {...}",
  "language": "javascript"
}

Response:
{
  "success": true,
  "analysis": "Correctness: ✓\nTime Complexity: O(n^2)...",
  "usage": {...}
}
```

### 5. Suggest Optimization
```
POST /api/v1/ai/optimize
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body:
{
  "code": "function twoSum(nums, target) {...}",
  "language": "javascript",
  "currentComplexity": "O(n^2)"
}

Response:
{
  "success": true,
  "suggestions": "You can optimize this to O(n)...",
  "usage": {...}
}
```

### 6. Generate Test Cases
```
GET /api/v1/ai/testcases/:problemId
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "testCases": "Edge cases:\n1. Empty array...",
  "cached": false,
  "usage": {...}
}
```

### 7. Explain Solution
```
POST /api/v1/ai/explain-solution/:problemId
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body:
{
  "solution": "function twoSum(nums, target) {...}",
  "language": "javascript"
}

Response:
{
  "success": true,
  "explanation": "Step 1: Create a hash map...",
  "usage": {...}
}
```

### 8. Debug Code
```
POST /api/v1/ai/debug
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body:
{
  "code": "function twoSum(nums, target) {...}",
  "language": "javascript",
  "error": "Expected [0,1] but got 3"
}

Response:
{
  "success": true,
  "debug": "The issue is that you're returning...",
  "usage": {...}
}
```

### 9. Compare Approaches
```
POST /api/v1/ai/compare/:problemId
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body:
{
  "approach1": "Brute force - O(n^2) time, O(1) space",
  "approach2": "Hash map - O(n) time, O(n) space"
}

Response:
{
  "success": true,
  "comparison": "Approach 1 is simpler but slower...",
  "usage": {...}
}
```

### 10. Get Usage Stats
```
GET /api/v1/ai/usage?days=30
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "stats": {
    "totalRequests": 150,
    "totalTokens": 45000,
    "byType": {...},
    "daily": [...]
  }
}
```

---

## 📝 Problem Endpoints

### Get All Problems
```
GET /api/v1/problems
Authorization: Bearer {jwt_token}

Query params:
- difficulty: Easy|Medium|Hard
- tags: Array,HashTable
- page: 1
- limit: 20

Response:
{
  "success": true,
  "problems": [...],
  "pagination": {...}
}
```

### Get Problem by ID
```
GET /api/v1/problems/:id
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "problem": {...}
}
```

### Create Problem
```
POST /api/v1/problems
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body:
{
  "title": "Two Sum",
  "description": "Given an array...",
  "difficulty": "Easy",
  "tags": ["Array", "Hash Table"],
  "testCases": [...]
}

Response:
{
  "success": true,
  "problem": {...}
}
```

### Update Problem
```
PUT /api/v1/problems/:id
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body: {fields to update}

Response:
{
  "success": true,
  "problem": {...}
}
```

### Delete Problem
```
DELETE /api/v1/problems/:id
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "message": "Problem deleted"
}
```

---

## ⚡ Code Execution Endpoints

### Execute Code (Async via Queue)
```
POST /api/v1/execute-code
Authorization: Bearer {jwt_token}
Content-Type: application/json
Rate Limit: 10 requests/minute

Body:
{
  "problemId": "problem_id_here",
  "code": "function twoSum(nums, target) {...}",
  "language": "javascript"
}

Response:
{
  "success": true,
  "jobId": "job_123",
  "message": "Code execution queued"
}

WebSocket Event (when complete):
{
  "event": "submission:completed",
  "data": {
    "jobId": "job_123",
    "status": "accepted",
    "output": "...",
    "executionTime": "45ms"
  }
}
```

---

## 📊 Submission Endpoints

### Get User Submissions
```
GET /api/v1/submission/user/:userId
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "submissions": [...]
}
```

### Get Problem Submissions
```
GET /api/v1/submission/problem/:problemId
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "submissions": [...]
}
```

---

## 📚 Playlist Endpoints

### Create Playlist
```
POST /api/v1/playlist
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body:
{
  "name": "My Playlist",
  "description": "Practice problems",
  "problems": ["problem_id_1", "problem_id_2"]
}

Response:
{
  "success": true,
  "playlist": {...}
}
```

### Get User Playlists
```
GET /api/v1/playlist/user/:userId
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "playlists": [...]
}
```

### Add Problem to Playlist
```
POST /api/v1/playlist/:playlistId/problem
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body:
{
  "problemId": "problem_id_here"
}

Response:
{
  "success": true,
  "playlist": {...}
}
```

---

## 🏆 Leaderboard Endpoints

### Get Global Leaderboard
```
GET /api/v1/leaderboard
Authorization: Bearer {jwt_token}

Query params:
- limit: 100 (default)
- offset: 0

Response:
{
  "success": true,
  "leaderboard": [
    {
      "userId": "...",
      "name": "John Doe",
      "score": 1500,
      "problemsSolved": 50,
      "rank": 1
    },
    ...
  ]
}
```

### Get User Rank
```
GET /api/v1/leaderboard/user/:userId
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "rank": 42,
  "score": 850,
  "problemsSolved": 25
}
```

---

## 🏥 Health Check Endpoints

### Basic Health Check (No Auth)
```
GET /api/v1/health

Response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "rabbitmq": "connected"
  }
}
```

### Detailed Health Check
```
GET /api/v1/health/detailed
Authorization: Bearer {jwt_token}

Response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "system": {
    "uptime": 3600,
    "memory": {...},
    "cpu": {...}
  },
  "queues": {
    "codeExecution": {
      "messageCount": 5,
      "consumerCount": 1
    }
  },
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "rabbitmq": "connected",
    "openrouter": "healthy"
  },
  "ai": {
    "status": "healthy",
    "modelsAvailable": 150
  }
}
```

---

## 🔌 WebSocket Events

### Connect
```javascript
const socket = io('http://localhost:8080', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events

#### submission:completed
```javascript
socket.on('submission:completed', (data) => {
  console.log(data);
  // {
  //   jobId: "job_123",
  //   userId: "user_id",
  //   status: "accepted",
  //   output: "...",
  //   executionTime: "45ms"
  // }
});
```

#### notification
```javascript
socket.on('notification', (data) => {
  console.log(data);
  // {
  //   type: "submission_result",
  //   message: "Your submission was accepted!",
  //   data: {...}
  // }
});
```

#### leaderboard:update
```javascript
socket.on('leaderboard:update', (data) => {
  console.log(data);
  // {
  //   userId: "user_id",
  //   newRank: 42,
  //   score: 850
  // }
});
```

---

## 📊 Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Code Execution | 10 requests | 1 minute |
| General API | 100 requests | 1 minute |
| AI Endpoints | 100 requests | 1 minute |

---

## 🔑 Authentication

All endpoints (except `/api/v1/health` and `/api/v1/auth/*`) require JWT authentication:

```
Authorization: Bearer {your_jwt_token}
```

Get token from:
- `/api/v1/auth/register` response
- `/api/v1/auth/login` response

---

## 🌐 Environment Variables

```env
# Server
PORT=8080

# Database
MONGODB_URI=mongodb://admin:admin@localhost:27017/leetcode?authSource=admin

# JWT
JWT_SECRET=your-secret-key

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redispass123

# RabbitMQ
RABBITMQ_URL=amqp://admin:rabbitmqpass123@rabbitmq:5672

# Judge0
RAPIDAPI_KEY=your-rapidapi-key
RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com

# OpenRouter AI
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_TIMEOUT=30000
APP_URL=http://localhost:8080
```

---

## 📦 Quick Commands

```bash
# Test OpenRouter connection
npm run test:openrouter

# Start server
npm start

# Start with Docker
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop Docker
docker-compose down
```

---

## 📚 Documentation Files

- `API_ENDPOINTS_REFERENCE.md` - This file (complete endpoint reference)
- `OPENROUTER_QUICK_START.md` - Quick setup guide
- `OPENROUTER_TESTING_GUIDE.md` - Detailed testing instructions
- `OPENROUTER_INTEGRATION.md` - Complete integration documentation
- `postman/OpenRouter_AI_API.postman_collection.json` - Postman collection

---

**Ready to test?** Import the Postman collection and start making requests!
