# Complete API Documentation

## Base URL
```
http://localhost:8080
```

## Authentication
Most endpoints require JWT authentication. The JWT token is stored in an HTTP-only cookie named `jwt` after login/register.

For Postman testing, you can:
1. Use cookie authentication (automatic after login)
2. Or manually set Bearer token in Authorization header

---

## 1. Authentication APIs

### 1.1 Register User
**POST** `/api/v1/auth/register`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "testuser@example.com",
  "password": "SecurePass123!",
  "name": "Test User"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id_here",
    "email": "testuser@example.com",
    "name": "Test User",
    "role": "USER",
    "image": null
  }
}
```

**Notes:**
- JWT token is automatically set in cookie
- Password is hashed before storage
- Email must be unique

---

### 1.2 Login User
**POST** `/api/v1/auth/login`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "testuser@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "User login successfully",
  "user": {
    "id": "user_id_here",
    "email": "testuser@example.com",
    "name": "Test User",
    "role": "USER",
    "image": null
  }
}
```

**Notes:**
- JWT token is set in HTTP-only cookie
- Token expires in 7 days

---

### 1.3 Check Auth Status
**GET** `/api/v1/auth/check`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "User authenticated successfully",
  "user": {
    "id": "user_id_here",
    "email": "testuser@example.com",
    "name": "Test User",
    "role": "USER"
  }
}
```

---

### 1.4 Logout User
**POST** `/api/v1/auth/logout`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Notes:**
- Clears JWT cookie

---

## 2. Problem APIs

### 2.1 Create Problem (Admin Only)
**POST** `/api/v1/problems/create-problem`

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "title": "Two Sum",
  "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  "difficulty": "Easy",
  "tags": ["Array", "Hash Table"],
  "examples": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    }
  ],
  "constraints": [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9"
  ],
  "testCases": [
    {
      "input": "[2,7,11,15]\n9",
      "output": "[0,1]"
    },
    {
      "input": "[3,2,4]\n6",
      "output": "[1,2]"
    }
  ],
  "codeSnippets": {
    "javascript": "function twoSum(nums, target) {\n    // Your code here\n}",
    "python": "def twoSum(nums, target):\n    # Your code here\n    pass"
  },
  "referenceSolutions": {
    "javascript": "function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}"
  },
  "hints": ["Use a hash map to store numbers you've seen"],
  "editorial": "The optimal solution uses a hash map for O(n) time complexity."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Problem created successfully",
  "problem": {
    "id": "problem_id_here",
    "title": "Two Sum",
    "difficulty": "Easy",
    ...
  }
}
```

**Notes:**
- Reference solutions are validated against test cases using Judge0
- Only users with ADMIN role can create problems

---

### 2.2 Get All Problems
**GET** `/api/v1/problems/get-all-problems`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Problems fetched successfully",
  "problems": [
    {
      "id": "problem_id",
      "title": "Two Sum",
      "description": "...",
      "difficulty": "Easy",
      "tags": ["Array", "Hash Table"],
      "solvedBy": []
    }
  ],
  "cached": false
}
```

**Notes:**
- Results are cached for 600 seconds
- Shows solved status for current user

---

### 2.3 Get Problem By ID
**GET** `/api/v1/problems/get-problem/:id`

**Authentication:** None required

**URL Parameters:**
- `id` - Problem ID

**Response (200):**
```json
{
  "success": true,
  "message": "Problem fetched successfully",
  "problem": {
    "id": "problem_id",
    "title": "Two Sum",
    "description": "...",
    "difficulty": "Easy",
    "tags": ["Array", "Hash Table"],
    "examples": [...],
    "constraints": [...],
    "testCases": [...],
    "codeSnippets": {...},
    "hints": [...],
    "editorial": "..."
  },
  "cached": false
}
```

**Notes:**
- Cached for 3600 seconds
- No authentication required

---

### 2.4 Update Problem (Admin Only)
**PUT** `/api/v1/problems/update-problem/:id`

**Authentication:** Required (Admin role)

**URL Parameters:**
- `id` - Problem ID

**Request Body:** Same as Create Problem

**Response (200):**
```json
{
  "success": true,
  "message": "Problem updated successfully",
  "problem": {...}
}
```

---

### 2.5 Delete Problem (Admin Only)
**DELETE** `/api/v1/problems/delete-problem/:id`

**Authentication:** Required (Admin role)

**URL Parameters:**
- `id` - Problem ID

**Response (200):**
```json
{
  "success": true,
  "message": "Problem deleted successfully"
}
```

---

### 2.6 Get Solved Problems
**GET** `/api/v1/problems/get-solved-problem`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Problems fetched successfully",
  "problems": [...]
}
```

**Notes:**
- Returns only problems solved by current user

---

## 3. Code Execution APIs

### 3.1 Execute Code
**POST** `/api/v1/execute-code`

**Authentication:** Required

**Rate Limit:** Special rate limit for code execution

**Request Body:**
```json
{
  "source_code": "function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}",
  "language_id": 63,
  "stdin": ["[2,7,11,15]\n9", "[3,2,4]\n6", "[3,3]\n6"],
  "expected_outputs": ["[0,1]", "[1,2]", "[0,1]"],
  "problemId": "problem_id_here"
}
```

**Language IDs:**
- JavaScript (Node.js): 63
- Python: 71
- Java: 62
- C++: 54
- C: 50
- Go: 60
- Ruby: 72
- PHP: 68
- TypeScript: 74

**Response (202):**
```json
{
  "success": true,
  "message": "Code execution queued",
  "submissionId": "uuid-here",
  "status": "queued"
}
```

**Notes:**
- Code execution is asynchronous via RabbitMQ
- Use submissionId to check status
- Results are stored in Redis

---

### 3.2 Get Submission Status
**GET** `/api/v1/execute-code/status/:submissionId`

**Authentication:** Required

**URL Parameters:**
- `submissionId` - Submission UUID

**Response (200) - Queued/Processing:**
```json
{
  "submissionId": "uuid-here",
  "status": "queued"
}
```

**Response (200) - Completed:**
```json
{
  "submissionId": "uuid-here",
  "status": "completed",
  "results": [...],
  "allPassed": true
}
```

**Response (500) - Failed:**
```json
{
  "error": "Execution failed",
  "details": "..."
}
```

**Status Values:**
- `queued` - Waiting in queue
- `processing` - Currently executing
- `completed` - Execution finished
- `failed` - Execution error

---

## 4. Submission APIs

### 4.1 Get All User Submissions
**GET** `/api/v1/submission/get-all-submission`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Submissions fetched successfully",
  "submissions": [
    {
      "id": "submission_id",
      "userId": "user_id",
      "problemId": "problem_id",
      "language": "javascript",
      "status": "Accepted",
      "runtime": "72ms",
      "memory": "42.1MB",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 4.2 Get Submissions For Problem
**GET** `/api/v1/submission/get-submissions/:problemid`

**Authentication:** Required

**URL Parameters:**
- `problemid` - Problem ID

**Response (200):**
```json
{
  "success": true,
  "message": "Submissions fetched successfully",
  "submissions": [...]
}
```

**Notes:**
- Returns only current user's submissions for the problem

---

### 4.3 Get Submission Count For Problem
**GET** `/api/v1/submission/get-submissions-count/:problemid`

**Authentication:** Required

**URL Parameters:**
- `problemid` - Problem ID

**Response (200):**
```json
{
  "success": true,
  "message": "Submissions count fetched successfully",
  "count": 42
}
```

**Notes:**
- Returns total count from all users

---

## 5. Playlist APIs

### 5.1 Create Playlist
**POST** `/api/v1/playlist/create-playlist`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "My Favorite Problems",
  "description": "Collection of problems I want to practice"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Playlist created successfully",
  "playList": {
    "id": "playlist_id",
    "name": "My Favorite Problems",
    "description": "Collection of problems I want to practice",
    "userId": "user_id"
  }
}
```

---

### 5.2 Get All Playlists
**GET** `/api/v1/playlist`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Playlists fetched successfully",
  "playLists": [
    {
      "id": "playlist_id",
      "name": "My Favorite Problems",
      "description": "...",
      "userId": "user_id",
      "problems": [
        {
          "id": "relation_id",
          "playlistId": "playlist_id",
          "problemId": "problem_id",
          "createdAt": "...",
          "problem": {
            "id": "problem_id",
            "title": "Two Sum",
            ...
          }
        }
      ]
    }
  ]
}
```

---

### 5.3 Get Playlist Details
**GET** `/api/v1/playlist/:playlistId`

**Authentication:** Required

**URL Parameters:**
- `playlistId` - Playlist ID

**Response (200):**
```json
{
  "success": true,
  "message": "Playlist fetched successfully",
  "playList": {
    "id": "playlist_id",
    "name": "My Favorite Problems",
    "problems": [...]
  }
}
```

---

### 5.4 Add Problems to Playlist
**POST** `/api/v1/playlist/:playlistId/add-problem`

**Authentication:** Required

**URL Parameters:**
- `playlistId` - Playlist ID

**Request Body:**
```json
{
  "problemIds": ["problem_id_1", "problem_id_2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Problems added to playlist successfully",
  "problemsInPlaylist": [...]
}
```

**Notes:**
- Can add multiple problems at once
- Duplicate problems are ignored

---

### 5.5 Remove Problems from Playlist
**DELETE** `/api/v1/playlist/:playlistId/remove-problem`

**Authentication:** Required

**URL Parameters:**
- `playlistId` - Playlist ID

**Request Body:**
```json
{
  "problemIds": ["problem_id_1", "problem_id_2"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Problems removed from playlist successfully",
  "deletedCount": 2
}
```

---

### 5.6 Delete Playlist
**DELETE** `/api/v1/playlist/:playlistId`

**Authentication:** Required

**URL Parameters:**
- `playlistId` - Playlist ID

**Response (200):**
```json
{
  "success": true,
  "message": "Playlist deleted successfully",
  "deletedPlaylist": {...}
}
```

---

## 6. Leaderboard APIs

### 6.1 Get Global Leaderboard
**GET** `/api/v1/leaderboard?limit=100`

**Authentication:** None required

**Query Parameters:**
- `limit` (optional) - Number of users to return (default: 100)

**Response (200):**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user_id",
      "name": "User Name",
      "problemsSolved": 150,
      "score": 1500
    }
  ]
}
```

---

### 6.2 Get User Rank
**GET** `/api/v1/leaderboard/rank`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "rank": 42
}
```

---

### 6.3 Get User Stats (Self)
**GET** `/api/v1/leaderboard/stats`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "userId": "user_id",
    "problemsSolved": 50,
    "easyCount": 20,
    "mediumCount": 25,
    "hardCount": 5,
    "totalSubmissions": 150,
    "acceptanceRate": 0.75
  }
}
```

---

### 6.4 Get User Stats (By ID)
**GET** `/api/v1/leaderboard/stats/:userId`

**Authentication:** Required

**URL Parameters:**
- `userId` - User ID

**Response (200):**
```json
{
  "success": true,
  "stats": {...}
}
```

---

## 7. AI Feature APIs

### 7.1 Get Hint (No Code)
**POST** `/api/v1/ai/hint/:problemId`

**Authentication:** Required

**URL Parameters:**
- `problemId` - Problem ID

**Request Body:**
```json
{}
```

**Response (200):**
```json
{
  "success": true,
  "hint": "Consider using a hash map to store the numbers you've seen...",
  "cached": false,
  "usage": {
    "promptTokens": 150,
    "completionTokens": 75,
    "totalTokens": 225
  }
}
```

---

### 7.2 Get Hint (With Code)
**POST** `/api/v1/ai/hint/:problemId`

**Authentication:** Required

**URL Parameters:**
- `problemId` - Problem ID

**Request Body:**
```json
{
  "code": "function twoSum(nums, target) {\n  // I'm stuck here\n}"
}
```

**Response (200):**
```json
{
  "success": true,
  "hint": "You're on the right track! Try thinking about...",
  "cached": false,
  "usage": {...}
}
```

---

### 7.3 Explain Problem
**GET** `/api/v1/ai/explain/:problemId`

**Authentication:** Required

**URL Parameters:**
- `problemId` - Problem ID

**Response (200):**
```json
{
  "success": true,
  "explanation": "This problem asks you to find two numbers in an array...",
  "cached": false,
  "usage": {...}
}
```

---

### 7.4 Analyze Code
**POST** `/api/v1/ai/analyze/:problemId`

**Authentication:** Required

**URL Parameters:**
- `problemId` - Problem ID

**Request Body:**
```json
{
  "code": "function twoSum(nums, target) {...}",
  "language": "javascript"
}
```

**Response (200):**
```json
{
  "success": true,
  "analysis": "Time Complexity: O(n^2)\nSpace Complexity: O(1)\n\nYour solution uses nested loops...",
  "usage": {...}
}
```

---

### 7.5 Suggest Optimization
**POST** `/api/v1/ai/optimize`

**Authentication:** Required

**Request Body:**
```json
{
  "code": "function twoSum(nums, target) {...}",
  "language": "javascript",
  "currentComplexity": "O(n^2)"
}
```

**Response (200):**
```json
{
  "success": true,
  "suggestions": "You can optimize this to O(n) by using a hash map...",
  "usage": {...}
}
```

---

### 7.6 Generate Test Cases
**GET** `/api/v1/ai/testcases/:problemId`

**Authentication:** Required

**URL Parameters:**
- `problemId` - Problem ID

**Response (200):**
```json
{
  "success": true,
  "testCases": [
    {
      "input": "[1, 2, 3, 4]",
      "output": "[0, 1]",
      "explanation": "Edge case: smallest valid input"
    }
  ],
  "cached": false,
  "usage": {...}
}
```

---

### 7.7 Explain Solution
**POST** `/api/v1/ai/explain-solution/:problemId`

**Authentication:** Required

**URL Parameters:**
- `problemId` - Problem ID

**Request Body:**
```json
{
  "solution": "function twoSum(nums, target) {...}",
  "language": "javascript"
}
```

**Response (200):**
```json
{
  "success": true,
  "explanation": "This solution works by...",
  "usage": {...}
}
```

---

### 7.8 Debug Code
**POST** `/api/v1/ai/debug`

**Authentication:** Required

**Request Body:**
```json
{
  "code": "function twoSum(nums, target) {...}",
  "language": "javascript",
  "error": "Expected [0,1] but got 3"
}
```

**Response (200):**
```json
{
  "success": true,
  "debug": "The issue is that you're returning the sum instead of indices...",
  "usage": {...}
}
```

---

### 7.9 Compare Approaches
**POST** `/api/v1/ai/compare/:problemId`

**Authentication:** Required

**URL Parameters:**
- `problemId` - Problem ID

**Request Body:**
```json
{
  "approach1": "Brute force with nested loops - O(n^2) time, O(1) space",
  "approach2": "Hash map approach - O(n) time, O(n) space"
}
```

**Response (200):**
```json
{
  "success": true,
  "comparison": "Approach 1 is simpler but slower...\nApproach 2 is faster but uses more memory...",
  "usage": {...}
}
```

---

### 7.10 Get AI Usage Stats
**GET** `/api/v1/ai/usage?days=30`

**Authentication:** Required

**Query Parameters:**
- `days` (optional) - Number of days (default: 30)

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalRequests": 150,
    "totalTokens": 50000,
    "requestsByFeature": {
      "hint": 50,
      "explain": 30,
      "analyze": 40,
      "optimize": 30
    }
  }
}
```

---

## 8. Health Check APIs

### 8.1 Basic Health Check
**GET** `/api/v1/health`

**Authentication:** None required

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "rabbitmq": "connected"
  }
}
```

---

### 8.2 Detailed Health Check
**GET** `/api/v1/health/detailed`

**Authentication:** Required

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "system": {
    "uptime": 3600,
    "memory": {...},
    "cpu": {...}
  },
  "queues": {
    "codeExecution": {
      "messageCount": 5,
      "consumerCount": 2
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
    "model": "google/gemini-flash-1.5"
  }
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [...]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Only Admin can update problems"
}
```

### 404 Not Found
```json
{
  "error": "Problem not found"
}
```

### 409 Conflict
```json
{
  "error": "User already exists"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create problem"
}
```

---

## Rate Limiting

The API implements rate limiting on certain endpoints:

- **Auth endpoints** (`/api/v1/auth/*`): Limited by IP
- **API endpoints** (most endpoints): Limited by user
- **Code execution** (`/api/v1/execute-code`): Special stricter limit

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Testing with Postman

1. Import the collection: `postman/Complete_API_Collection.postman_collection.json`
2. Set environment variables:
   - `baseUrl`: `http://localhost:8080`
   - `jwt_token`: (auto-set after login)
   - `problemId`: (set after creating/getting a problem)
   - `playlistId`: (set after creating a playlist)
   - `submissionId`: (set after code execution)
   - `userId`: (optional, for specific user queries)

3. Test flow:
   - Register/Login → Get JWT token
   - Create/Get problems
   - Execute code
   - Check submission status
   - Create playlists
   - Use AI features
   - Check leaderboard

---

## WebSocket Events

The API also supports real-time updates via Socket.IO:

**Events:**
- `submission:completed` - Emitted when code execution completes

**Connection:**
```javascript
const socket = io('http://localhost:8080');
socket.on('submission:completed', (data) => {
  console.log('Submission completed:', data);
});
```

---

## Notes

1. **Authentication**: JWT tokens are stored in HTTP-only cookies for security
2. **Caching**: Problems and AI responses are cached in Redis
3. **Async Execution**: Code execution is handled asynchronously via RabbitMQ
4. **AI Features**: Powered by OpenRouter (using Google Gemini Flash 1.5 by default)
5. **Judge0**: Used for code execution and validation
6. **Admin Role**: Required for creating/updating/deleting problems
