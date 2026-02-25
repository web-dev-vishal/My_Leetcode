# OpenRouter AI Integration - Testing Guide

## Quick Setup

### 1. Get Your OpenRouter API Key

1. Visit https://openrouter.ai/
2. Sign up or log in
3. Go to "Keys" section
4. Create a new API key
5. Copy the key

### 2. Update .env File

Open your `.env` file and replace the placeholder:

```env
OPENROUTER_API_KEY="your-actual-api-key-here"
```

### 3. Choose Your AI Model (Optional)

Default model is `anthropic/claude-3.5-sonnet`. You can change it to:

- `anthropic/claude-3-opus` - Highest quality
- `openai/gpt-4-turbo` - OpenAI's best
- `openai/gpt-3.5-turbo` - Faster, cheaper
- `google/gemini-pro` - Google's model

## Testing with Postman

### Import the Collection

1. Open Postman
2. Click "Import"
3. Select `postman/OpenRouter_AI_API.postman_collection.json`
4. Collection will be imported with all endpoints

### Set Environment Variables

In Postman, set these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `baseUrl` | `http://localhost:8080` | Your API base URL |
| `jwt_token` | (auto-set after login) | JWT authentication token |
| `problemId` | Your problem ID | MongoDB ObjectId of a problem |

### Testing Flow

#### Step 1: Start Your Application

```bash
# Using Docker
docker-compose up -d

# Or locally
npm start
```

#### Step 2: Register & Login

1. **Register User** - Creates a new user account
   - Endpoint: `POST /api/v1/auth/register`
   - Body:
   ```json
   {
     "email": "test@example.com",
     "password": "password123",
     "name": "Test User"
   }
   ```

2. **Login User** - Gets JWT token (auto-saved to environment)
   - Endpoint: `POST /api/v1/auth/login`
   - Body:
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
   - Token is automatically saved to `jwt_token` variable

#### Step 3: Create a Problem (Optional)

If you don't have a problem ID, create one first:

```bash
POST /api/v1/problems
{
  "title": "Two Sum",
  "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  "difficulty": "Easy",
  "tags": ["Array", "Hash Table"],
  "testCases": [
    {
      "input": "[2,7,11,15], 9",
      "output": "[0,1]"
    }
  ]
}
```

Copy the returned `_id` and set it as `problemId` in Postman variables.

#### Step 4: Test AI Endpoints

All AI endpoints require authentication (JWT token from login).

##### 1. Get Hint (No Code)
```
POST /api/v1/ai/hint/{{problemId}}
Body: {}
```

##### 2. Get Hint (With Code)
```
POST /api/v1/ai/hint/{{problemId}}
Body:
{
  "code": "function twoSum(nums, target) {\n  // I'm stuck here\n}"
}
```

##### 3. Explain Problem
```
GET /api/v1/ai/explain/{{problemId}}
```

##### 4. Analyze Code
```
POST /api/v1/ai/analyze/{{problemId}}
Body:
{
  "code": "function twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = i + 1; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) {\n        return [i, j];\n      }\n    }\n  }\n  return [];\n}",
  "language": "javascript"
}
```

##### 5. Suggest Optimization
```
POST /api/v1/ai/optimize
Body:
{
  "code": "function twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = i + 1; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) {\n        return [i, j];\n      }\n    }\n  }\n  return [];\n}",
  "language": "javascript",
  "currentComplexity": "O(n^2)"
}
```

##### 6. Generate Test Cases
```
GET /api/v1/ai/testcases/{{problemId}}
```

##### 7. Explain Solution
```
POST /api/v1/ai/explain-solution/{{problemId}}
Body:
{
  "solution": "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}",
  "language": "javascript"
}
```

##### 8. Debug Code
```
POST /api/v1/ai/debug
Body:
{
  "code": "function twoSum(nums, target) {\n  return nums[0] + nums[1];\n}",
  "language": "javascript",
  "error": "Expected [0,1] but got 3"
}
```

##### 9. Compare Approaches
```
POST /api/v1/ai/compare/{{problemId}}
Body:
{
  "approach1": "Brute force with nested loops - O(n^2) time, O(1) space",
  "approach2": "Hash map approach - O(n) time, O(n) space"
}
```

##### 10. Get Usage Stats
```
GET /api/v1/ai/usage?days=30
```

#### Step 5: Check Health Status

##### Basic Health Check (No Auth Required)
```
GET /api/v1/health
```

Response:
```json
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

##### Detailed Health Check (With AI Status)
```
GET /api/v1/health/detailed
```

Response includes OpenRouter status:
```json
{
  "status": "healthy",
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

## Expected Responses

### Success Response
```json
{
  "success": true,
  "hint": "Consider using a hash map to store numbers you've seen...",
  "cached": false,
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 75,
    "total_tokens": 225
  }
}
```

### Cached Response
```json
{
  "success": true,
  "explanation": "This problem asks you to find two numbers...",
  "cached": true,
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Problem not found"
}
```

## Troubleshooting

### 1. "OPENROUTER_API_KEY environment variable is required"

**Solution**: Make sure you've added your API key to `.env` file and restarted the server.

### 2. "401 Unauthorized"

**Solution**: 
- Make sure you're logged in
- Check that JWT token is set in Postman environment
- Token might be expired, login again

### 3. "429 Too Many Requests"

**Solution**: 
- Rate limit hit (10 req/min for code execution, 100 req/min for API)
- Wait a minute and try again
- Automatic retry with exponential backoff is implemented

### 4. "OpenRouter API error"

**Solution**:
- Check your API key is valid
- Verify you have credits in your OpenRouter account
- Check OpenRouter status at https://status.openrouter.ai/

### 5. "Problem not found"

**Solution**: Make sure the `problemId` in Postman variables is a valid MongoDB ObjectId from your database.

## Testing Checklist

- [ ] API key added to `.env`
- [ ] Server started successfully
- [ ] User registered and logged in
- [ ] JWT token saved in Postman
- [ ] Problem ID set in Postman variables
- [ ] All 9 AI endpoints tested
- [ ] Health check shows OpenRouter as "healthy"
- [ ] Usage stats endpoint working
- [ ] Caching working (second request faster)
- [ ] Rate limiting working (100+ requests blocked)

## Performance Metrics

### Without Cache
- First request: ~2-5 seconds
- API calls: Every request hits OpenRouter

### With Cache
- Cached request: ~50-100ms (95% faster)
- API calls: Reduced by 80-90%

### Rate Limits
- Code Execution: 10 requests/minute
- General API: 100 requests/minute
- AI endpoints: Inherit from general API limit

## Cost Monitoring

Track your OpenRouter usage:

1. **Via API**:
   ```
   GET /api/v1/ai/usage?days=30
   ```

2. **Via OpenRouter Dashboard**:
   - Visit https://openrouter.ai/activity
   - View detailed usage and costs

3. **Via Logs**:
   - Check `logs/` directory
   - Search for "AI usage tracked"

## Next Steps

1. Test all endpoints in Postman
2. Monitor usage and costs
3. Adjust cache TTL if needed (in `src/services/aiService.js`)
4. Customize AI prompts (in `src/lib/openrouter.js`)
5. Add more AI features as needed

## Support

For issues:
- Check logs in `logs/` directory
- Review `OPENROUTER_INTEGRATION.md` for detailed documentation
- Check OpenRouter docs: https://openrouter.ai/docs
