# Postman Testing Guide

## Quick Start

### 1. Import Collection
1. Open Postman
2. Click "Import" button
3. Select file: `postman/Complete_API_Collection.postman_collection.json`
4. Collection will appear in your sidebar

### 2. Set Up Environment Variables
Create a new environment or use collection variables:

| Variable | Initial Value | Description |
|----------|--------------|-------------|
| `baseUrl` | `http://localhost:8080` | API base URL |
| `jwt_token` | (empty) | Auto-set after login |
| `problemId` | (empty) | Set manually after creating/getting problem |
| `playlistId` | (empty) | Set manually after creating playlist |
| `submissionId` | (empty) | Auto-set after code execution |
| `userId` | (empty) | Optional, for specific user queries |

### 3. Start Testing

## Testing Flow

### Step 1: Authentication
```
1. Register User → Creates account and sets JWT cookie
2. Login User → Gets JWT token (auto-saved to environment)
3. Check Auth Status → Verify authentication works
```

**Important:** After login, the JWT token is automatically saved to `jwt_token` variable.

---

### Step 2: Create/Get Problems (Admin Required)

#### For Admin Users:
```
1. Create Problem → Creates a new coding problem
   - Copy the returned problem ID
   - Set it as {{problemId}} variable
```

#### For All Users:
```
1. Get All Problems → Lists all available problems
2. Get Problem By ID → Get specific problem details
   - Use {{problemId}} in URL
```

**Sample Problem Data:**
```json
{
  "title": "Two Sum",
  "description": "Find two numbers that add up to target",
  "difficulty": "Easy",
  "tags": ["Array", "Hash Table"],
  "examples": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "nums[0] + nums[1] == 9"
    }
  ],
  "constraints": ["2 <= nums.length <= 10^4"],
  "testCases": [
    {
      "input": "[2,7,11,15]\n9",
      "output": "[0,1]"
    }
  ],
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

---

### Step 3: Execute Code
```
1. Execute Code → Submit code for testing
   - Returns submissionId
   - Status: "queued"
   
2. Get Submission Status → Check execution result
   - Use {{submissionId}} in URL
   - Poll until status is "completed"
```

**Sample Code Execution:**
```json
{
  "source_code": "function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}",
  "language_id": 63,
  "stdin": ["[2,7,11,15]\n9", "[3,2,4]\n6"],
  "expected_outputs": ["[0,1]", "[1,2]"],
  "problemId": "{{problemId}}"
}
```

**Language IDs:**
- JavaScript: 63
- Python: 71
- Java: 62
- C++: 54
- C: 50

---

### Step 4: Submissions
```
1. Get All User Submissions → Your submission history
2. Get Submissions For Problem → Submissions for specific problem
3. Get Submission Count → Total submissions by all users
```

---

### Step 5: Playlists
```
1. Create Playlist → Create new playlist
   - Copy returned playlist ID
   - Set as {{playlistId}}
   
2. Add Problems to Playlist → Add problems
   - Use {{playlistId}} and {{problemId}}
   
3. Get All Playlists → List your playlists
4. Get Playlist Details → View specific playlist
5. Remove Problems → Remove from playlist
6. Delete Playlist → Delete entire playlist
```

**Sample Playlist Creation:**
```json
{
  "name": "Array Problems",
  "description": "Practice array manipulation"
}
```

**Sample Add Problems:**
```json
{
  "problemIds": ["problem_id_1", "problem_id_2"]
}
```

---

### Step 6: Leaderboard
```
1. Get Global Leaderboard → Top users (no auth needed)
2. Get User Rank → Your current rank
3. Get User Stats (Self) → Your statistics
4. Get User Stats (By ID) → Other user's stats
```

---

### Step 7: AI Features

All AI endpoints require authentication and a valid {{problemId}}.

```
1. Get Hint (No Code) → General hint
2. Get Hint (With Code) → Contextual hint based on your code
3. Explain Problem → AI explanation of problem
4. Analyze Code → Get complexity analysis
5. Suggest Optimization → Get optimization suggestions
6. Generate Test Cases → AI-generated test cases
7. Explain Solution → Understand a solution
8. Debug Code → Help fixing errors
9. Compare Approaches → Compare two solutions
10. Get AI Usage Stats → Your AI usage statistics
```

**Sample AI Requests:**

**Analyze Code:**
```json
{
  "code": "function twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = i + 1; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) {\n        return [i, j];\n      }\n    }\n  }\n  return [];\n}",
  "language": "javascript"
}
```

**Debug Code:**
```json
{
  "code": "function twoSum(nums, target) {\n  return nums[0] + nums[1];\n}",
  "language": "javascript",
  "error": "Expected [0,1] but got 3"
}
```

---

### Step 8: Health Checks
```
1. Basic Health Check → Quick status (no auth)
2. Detailed Health Check → Full system info (auth required)
```

---

## Common Issues & Solutions

### Issue 1: "Unauthorized" Error
**Solution:** 
- Make sure you've logged in
- Check that JWT token is set in environment
- Token expires after 7 days - login again

### Issue 2: "Problem not found"
**Solution:**
- Verify {{problemId}} is set correctly
- Create a problem first (admin) or get existing problem ID

### Issue 3: "Invalid problem ID format"
**Solution:**
- Problem ID must be valid MongoDB ObjectId
- Copy ID from create/get problem response

### Issue 4: "Only Admin can create problems"
**Solution:**
- Register a new user
- Manually update user role to "ADMIN" in database
- Or use existing admin account

### Issue 5: Code execution stays "queued"
**Solution:**
- Check if RabbitMQ worker is running
- Check Redis connection
- View logs: `npm run docker:logs`

### Issue 6: Rate limit exceeded
**Solution:**
- Wait for rate limit to reset
- Check `X-RateLimit-Reset` header
- Reduce request frequency

---

## Testing Checklist

### Basic Flow
- [ ] Register new user
- [ ] Login with credentials
- [ ] Check authentication status
- [ ] Get all problems
- [ ] Get specific problem
- [ ] Execute code
- [ ] Check submission status
- [ ] View submissions
- [ ] Create playlist
- [ ] Add problems to playlist
- [ ] View leaderboard
- [ ] Check health status

### Admin Flow
- [ ] Create new problem
- [ ] Update problem
- [ ] Delete problem

### AI Features
- [ ] Get hint without code
- [ ] Get hint with code
- [ ] Explain problem
- [ ] Analyze code
- [ ] Suggest optimization
- [ ] Generate test cases
- [ ] Explain solution
- [ ] Debug code
- [ ] Compare approaches
- [ ] Check AI usage stats

---

## Tips for Effective Testing

1. **Use Collection Runner**
   - Run entire collection at once
   - Set delays between requests
   - Check for failures

2. **Save Responses**
   - Copy IDs from responses
   - Update environment variables
   - Use in subsequent requests

3. **Test Error Cases**
   - Try invalid IDs
   - Test without authentication
   - Send malformed data
   - Test rate limits

4. **Monitor Logs**
   - Check server logs for errors
   - View RabbitMQ queue status
   - Monitor Redis cache

5. **Use Pre-request Scripts**
   - Auto-generate test data
   - Set timestamps
   - Create dynamic values

6. **Use Tests Tab**
   - Validate response status
   - Check response structure
   - Assert expected values

---

## Sample Test Scripts

### Auto-save JWT Token (Login request)
```javascript
if (pm.response.code === 200) {
    var cookies = pm.cookies.get('jwt');
    if (cookies) {
        pm.environment.set('jwt_token', cookies);
    }
}
```

### Auto-save Problem ID (Create Problem)
```javascript
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set('problemId', jsonData.problem.id);
}
```

### Auto-save Submission ID (Execute Code)
```javascript
if (pm.response.code === 202) {
    var jsonData = pm.response.json();
    pm.environment.set('submissionId', jsonData.submissionId);
}
```

### Validate Response Structure
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});
```

---

## Environment Setup for Different Scenarios

### Local Development
```
baseUrl: http://localhost:8080
```

### Docker
```
baseUrl: http://localhost:8080
```

### Production
```
baseUrl: https://your-domain.com
```

---

## Quick Reference: All Endpoints

### Authentication (4)
- POST `/api/v1/auth/register`
- POST `/api/v1/auth/login`
- GET `/api/v1/auth/check`
- POST `/api/v1/auth/logout`

### Problems (6)
- POST `/api/v1/problems/create-problem` (Admin)
- GET `/api/v1/problems/get-all-problems`
- GET `/api/v1/problems/get-problem/:id`
- PUT `/api/v1/problems/update-problem/:id` (Admin)
- DELETE `/api/v1/problems/delete-problem/:id` (Admin)
- GET `/api/v1/problems/get-solved-problem`

### Code Execution (2)
- POST `/api/v1/execute-code`
- GET `/api/v1/execute-code/status/:submissionId`

### Submissions (3)
- GET `/api/v1/submission/get-all-submission`
- GET `/api/v1/submission/get-submissions/:problemid`
- GET `/api/v1/submission/get-submissions-count/:problemid`

### Playlists (6)
- POST `/api/v1/playlist/create-playlist`
- GET `/api/v1/playlist`
- GET `/api/v1/playlist/:playlistId`
- POST `/api/v1/playlist/:playlistId/add-problem`
- DELETE `/api/v1/playlist/:playlistId/remove-problem`
- DELETE `/api/v1/playlist/:playlistId`

### Leaderboard (4)
- GET `/api/v1/leaderboard`
- GET `/api/v1/leaderboard/rank`
- GET `/api/v1/leaderboard/stats`
- GET `/api/v1/leaderboard/stats/:userId`

### AI Features (10)
- POST `/api/v1/ai/hint/:problemId`
- GET `/api/v1/ai/explain/:problemId`
- POST `/api/v1/ai/analyze/:problemId`
- POST `/api/v1/ai/optimize`
- GET `/api/v1/ai/testcases/:problemId`
- POST `/api/v1/ai/explain-solution/:problemId`
- POST `/api/v1/ai/debug`
- POST `/api/v1/ai/compare/:problemId`
- GET `/api/v1/ai/usage`

### Health (2)
- GET `/api/v1/health`
- GET `/api/v1/health/detailed`

**Total: 37 endpoints**
