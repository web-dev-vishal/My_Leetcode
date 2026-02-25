# API Quick Reference Guide

## 📋 Overview
- **Base URL:** `http://localhost:8080`
- **Total Endpoints:** 37
- **Authentication:** JWT (HTTP-only cookie)
- **Rate Limited:** Yes (varies by endpoint)

---

## 🔐 Authentication Endpoints (4)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | ❌ | Register new user |
| POST | `/api/v1/auth/login` | ❌ | Login user |
| GET | `/api/v1/auth/check` | ✅ | Check auth status |
| POST | `/api/v1/auth/logout` | ✅ | Logout user |

**Sample Register/Login:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "User Name"
}
```

---

## 📝 Problem Endpoints (6)

| Method | Endpoint | Auth | Admin | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/v1/problems/create-problem` | ✅ | ✅ | Create problem |
| GET | `/api/v1/problems/get-all-problems` | ✅ | ❌ | Get all problems |
| GET | `/api/v1/problems/get-problem/:id` | ❌ | ❌ | Get problem by ID |
| PUT | `/api/v1/problems/update-problem/:id` | ✅ | ✅ | Update problem |
| DELETE | `/api/v1/problems/delete-problem/:id` | ✅ | ✅ | Delete problem |
| GET | `/api/v1/problems/get-solved-problem` | ✅ | ❌ | Get solved problems |

**Difficulty Levels:** Easy, Medium, Hard

---

## ⚡ Code Execution Endpoints (2)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/execute-code` | ✅ | Execute code |
| GET | `/api/v1/execute-code/status/:submissionId` | ✅ | Get execution status |

**Language IDs:**
- JavaScript (Node.js): `63`
- Python: `71`
- Java: `62`
- C++: `54`
- C: `50`
- Go: `60`
- Ruby: `72`
- PHP: `68`
- TypeScript: `74`

**Sample Execute Code:**
```json
{
  "source_code": "function twoSum(nums, target) { ... }",
  "language_id": 63,
  "stdin": ["[2,7,11,15]\n9"],
  "expected_outputs": ["[0,1]"],
  "problemId": "problem_id"
}
```

**Execution Status:**
- `queued` - Waiting in queue
- `processing` - Currently executing
- `completed` - Finished successfully
- `failed` - Execution error

---

## 📊 Submission Endpoints (3)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/submission/get-all-submission` | ✅ | Get all user submissions |
| GET | `/api/v1/submission/get-submissions/:problemid` | ✅ | Get submissions for problem |
| GET | `/api/v1/submission/get-submissions-count/:problemid` | ✅ | Get submission count |

---

## 📚 Playlist Endpoints (6)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/playlist/create-playlist` | ✅ | Create playlist |
| GET | `/api/v1/playlist` | ✅ | Get all playlists |
| GET | `/api/v1/playlist/:playlistId` | ✅ | Get playlist details |
| POST | `/api/v1/playlist/:playlistId/add-problem` | ✅ | Add problems |
| DELETE | `/api/v1/playlist/:playlistId/remove-problem` | ✅ | Remove problems |
| DELETE | `/api/v1/playlist/:playlistId` | ✅ | Delete playlist |

**Sample Create Playlist:**
```json
{
  "name": "My Favorites",
  "description": "Problems I want to practice"
}
```

**Sample Add/Remove Problems:**
```json
{
  "problemIds": ["id1", "id2", "id3"]
}
```

---

## 🏆 Leaderboard Endpoints (4)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/leaderboard?limit=100` | ❌ | Get global leaderboard |
| GET | `/api/v1/leaderboard/rank` | ✅ | Get user rank |
| GET | `/api/v1/leaderboard/stats` | ✅ | Get user stats (self) |
| GET | `/api/v1/leaderboard/stats/:userId` | ✅ | Get user stats (by ID) |

---

## 🤖 AI Feature Endpoints (10)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/ai/hint/:problemId` | ✅ | Get hint |
| GET | `/api/v1/ai/explain/:problemId` | ✅ | Explain problem |
| POST | `/api/v1/ai/analyze/:problemId` | ✅ | Analyze code |
| POST | `/api/v1/ai/optimize` | ✅ | Suggest optimization |
| GET | `/api/v1/ai/testcases/:problemId` | ✅ | Generate test cases |
| POST | `/api/v1/ai/explain-solution/:problemId` | ✅ | Explain solution |
| POST | `/api/v1/ai/debug` | ✅ | Debug code |
| POST | `/api/v1/ai/compare/:problemId` | ✅ | Compare approaches |
| GET | `/api/v1/ai/usage?days=30` | ✅ | Get usage stats |

**AI Model:** Google Gemini Flash 1.5 (via OpenRouter)

**Sample AI Requests:**

**Get Hint:**
```json
{
  "code": "function twoSum(nums, target) { ... }"
}
```

**Analyze Code:**
```json
{
  "code": "function twoSum(nums, target) { ... }",
  "language": "javascript"
}
```

**Debug Code:**
```json
{
  "code": "function twoSum(nums, target) { ... }",
  "language": "javascript",
  "error": "Expected [0,1] but got 3"
}
```

---

## 🏥 Health Check Endpoints (2)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/health` | ❌ | Basic health check |
| GET | `/api/v1/health/detailed` | ✅ | Detailed health info |

---

## 🔑 Environment Variables for Postman

```
baseUrl: http://localhost:8080
jwt_token: (auto-set after login)
problemId: (set after creating/getting problem)
playlistId: (set after creating playlist)
submissionId: (set after code execution)
userId: (optional)
```

---

## 📦 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

---

## 🚨 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 202 | Accepted - Request queued |
| 400 | Bad Request - Invalid data |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - No permission |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## 🔄 Testing Flow

### 1. Authentication
```
Register → Login → Check Auth
```

### 2. Problems
```
Create Problem (Admin) → Get All Problems → Get Problem By ID
```

### 3. Code Execution
```
Execute Code → Get Status (poll until completed)
```

### 4. Submissions
```
Get All Submissions → Get Submissions For Problem
```

### 5. Playlists
```
Create Playlist → Add Problems → Get Playlist Details
```

### 6. AI Features
```
Get Hint → Analyze Code → Suggest Optimization
```

---

## 🛠️ Common Request Examples

### Create Problem (Admin)
```json
{
  "title": "Two Sum",
  "description": "Find two numbers that add up to target",
  "difficulty": "Easy",
  "tags": ["Array", "Hash Table"],
  "examples": [{
    "input": "nums = [2,7,11,15], target = 9",
    "output": "[0,1]",
    "explanation": "nums[0] + nums[1] == 9"
  }],
  "constraints": ["2 <= nums.length <= 10^4"],
  "testCases": [{
    "input": "[2,7,11,15]\n9",
    "output": "[0,1]"
  }],
  "codeSnippets": {
    "javascript": "function twoSum(nums, target) {\n    // Your code\n}"
  },
  "referenceSolutions": {
    "javascript": "function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}"
  },
  "hints": ["Use hash map"],
  "editorial": "Hash map solution is O(n)"
}
```

### Execute Code
```json
{
  "source_code": "function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}",
  "language_id": 63,
  "stdin": ["[2,7,11,15]\n9", "[3,2,4]\n6"],
  "expected_outputs": ["[0,1]", "[1,2]"],
  "problemId": "your_problem_id"
}
```

---

## 📝 Notes

1. **JWT Token**: Automatically set in cookie after login, expires in 7 days
2. **Rate Limiting**: Different limits for auth, API, and code execution
3. **Caching**: Problems and AI responses are cached in Redis
4. **Async Execution**: Code execution is queued in RabbitMQ
5. **Admin Role**: Required for creating/updating/deleting problems
6. **WebSocket**: Real-time updates via Socket.IO on port 8080

---

## 🔗 Files

- **Postman Collection**: `postman/Complete_API_Collection.postman_collection.json`
- **Full Documentation**: `API_DOCUMENTATION.md`
- **Testing Guide**: `POSTMAN_TESTING_GUIDE.md`
- **This Reference**: `API_QUICK_REFERENCE.md`

---

## 🚀 Quick Start Commands

```bash
# Start server
npm run dev

# Start with Docker
npm run docker:up

# View logs
npm run docker:logs

# Stop Docker
npm run docker:down
```

---

## 💡 Tips

1. Always login first to get JWT token
2. Save problem IDs for subsequent requests
3. Poll submission status until "completed"
4. Use environment variables in Postman
5. Check rate limit headers if requests fail
6. Monitor server logs for debugging
7. Test error cases (invalid IDs, missing auth, etc.)

---

## 📞 Support

For issues or questions:
1. Check server logs
2. Verify all services are running (MongoDB, Redis, RabbitMQ)
3. Ensure environment variables are set correctly
4. Review API documentation for correct request format
