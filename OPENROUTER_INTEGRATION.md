# OpenRouter AI Integration Documentation

## Overview

This document provides comprehensive documentation for the OpenRouter API integration in the LeetCode clone backend. The integration provides advanced AI-powered features for code hints, problem explanations, code analysis, and more.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Setup](#setup)
4. [API Endpoints](#api-endpoints)
5. [Usage Examples](#usage-examples)
6. [Security](#security)
7. [Performance](#performance)
8. [Monitoring](#monitoring)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

## Features

### AI-Powered Capabilities

1. **Code Hints** - Get intelligent hints without revealing the solution
2. **Problem Explanations** - Understand problem requirements clearly
3. **Code Analysis** - Get feedback on correctness, complexity, and quality
4. **Optimization Suggestions** - Improve time/space complexity
5. **Test Case Generation** - Generate comprehensive test cases
6. **Solution Explanations** - Step-by-step solution breakdowns
7. **Code Debugging** - Identify and fix code issues
8. **Approach Comparison** - Compare different solution approaches

### Technical Features

- **Intelligent Caching** - Cache AI responses to reduce API calls
- **Rate Limiting** - Prevent API abuse
- **Usage Tracking** - Monitor AI usage per user
- **Error Handling** - Automatic retries with exponential backoff
- **Token Management** - Track token usage
- **Health Monitoring** - Check OpenRouter API status

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Request                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              AI Controller Layer                         │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │  Hint    │ Explain  │ Analyze  │  Debug   │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              AI Service Layer                            │
│  • Request validation                                    │
│  • Cache checking                                        │
│  • Usage tracking                                        │
│  • Response formatting                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│           OpenRouter Client                              │
│  • API communication                                     │
│  • Retry logic                                           │
│  • Error handling                                        │
│  • Token management                                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│           OpenRouter API                                 │
│  https://openrouter.ai/api/v1                           │
└─────────────────────────────────────────────────────────┘
```

## Setup

### 1. Get OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key securely

### 2. Configure Environment Variables

Create or update `.env` file:

```env
# OpenRouter Configuration
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_TIMEOUT=30000
APP_URL=http://localhost:8080
```

### 3. Update Docker Compose

The `docker-compose.yml` is already configured to use the environment variable:

```yaml
environment:
  OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
```

### 4. Start Services

```bash
# Set your API key
export OPENROUTER_API_KEY="your_api_key_here"

# Start services
docker-compose up -d --build
```

## API Endpoints

### Base URL
```
http://localhost:8080/api/v1/ai
```

### Authentication
All endpoints require JWT authentication via Bearer token.

### Endpoints

#### 1. Get Hint
```http
POST /api/v1/ai/hint/:problemId
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "optional user code"
}
```

**Response:**
```json
{
  "success": true,
  "hint": "Consider using a hash map to store...",
  "cached": false,
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 75,
    "total_tokens": 225
  }
}
```

#### 2. Explain Problem
```http
GET /api/v1/ai/explain/:problemId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "explanation": "This problem asks you to...",
  "cached": true,
  "usage": {
    "prompt_tokens": 200,
    "completion_tokens": 150,
    "total_tokens": 350
  }
}
```

#### 3. Analyze Code
```http
POST /api/v1/ai/analyze/:problemId
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "function twoSum(nums, target) {...}",
  "language": "javascript"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": "1. Correctness: The solution is correct...\n2. Time Complexity: O(n)...",
  "usage": {...}
}
```

#### 4. Suggest Optimization
```http
POST /api/v1/ai/optimize
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "for (let i = 0; i < n; i++) {...}",
  "language": "javascript",
  "currentComplexity": "O(n^2)"
}
```

#### 5. Generate Test Cases
```http
GET /api/v1/ai/testcases/:problemId
Authorization: Bearer {token}
```

#### 6. Explain Solution
```http
POST /api/v1/ai/explain-solution/:problemId
Authorization: Bearer {token}
Content-Type: application/json

{
  "solution": "function solve() {...}",
  "language": "javascript"
}
```

#### 7. Debug Code
```http
POST /api/v1/ai/debug
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "function buggy() {...}",
  "language": "javascript",
  "error": "TypeError: Cannot read property..."
}
```

#### 8. Compare Approaches
```http
POST /api/v1/ai/compare/:problemId
Authorization: Bearer {token}
Content-Type: application/json

{
  "approach1": "Using hash map...",
  "approach2": "Using two pointers..."
}
```

#### 9. Get Usage Stats
```http
GET /api/v1/ai/usage?days=30
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalRequests": 150,
    "totalTokens": 45000,
    "byType": {},
    "daily": [
      {
        "date": "2024-01-01",
        "requests": 10,
        "tokens": 3000
      }
    ]
  }
}
```

## Usage Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:8080/api/v1';
const token = 'your_jwt_token';

// Get hint for a problem
async function getHint(problemId, code = null) {
  try {
    const response = await axios.post(
      `${API_URL}/ai/hint/${problemId}`,
      { code },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Hint:', response.data.hint);
    console.log('Cached:', response.data.cached);
    console.log('Tokens used:', response.data.usage.total_tokens);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Analyze code
async function analyzeCode(problemId, code, language) {
  try {
    const response = await axios.post(
      `${API_URL}/ai/analyze/${problemId}`,
      { code, language },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Analysis:', response.data.analysis);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Usage
getHint('problem123');
analyzeCode('problem123', 'function solve() {...}', 'javascript');
```

### Python

```python
import requests

API_URL = 'http://localhost:8080/api/v1'
token = 'your_jwt_token'

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Get hint
def get_hint(problem_id, code=None):
    url = f'{API_URL}/ai/hint/{problem_id}'
    data = {'code': code} if code else {}
    
    response = requests.post(url, json=data, headers=headers)
    result = response.json()
    
    print(f"Hint: {result['hint']}")
    print(f"Cached: {result['cached']}")
    print(f"Tokens: {result['usage']['total_tokens']}")

# Analyze code
def analyze_code(problem_id, code, language):
    url = f'{API_URL}/ai/analyze/{problem_id}'
    data = {'code': code, 'language': language}
    
    response = requests.post(url, json=data, headers=headers)
    result = response.json()
    
    print(f"Analysis: {result['analysis']}")

# Usage
get_hint('problem123')
analyze_code('problem123', 'def solve(): ...', 'python')
```

### cURL

```bash
# Get hint
curl -X POST http://localhost:8080/api/v1/ai/hint/problem123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "function solve() {}"}'

# Explain problem
curl -X GET http://localhost:8080/api/v1/ai/explain/problem123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Analyze code
curl -X POST http://localhost:8080/api/v1/ai/analyze/problem123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function twoSum(nums, target) { return []; }",
    "language": "javascript"
  }'

# Get usage stats
curl -X GET http://localhost:8080/api/v1/ai/usage?days=30 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security

### API Key Management

1. **Environment Variables**: API key stored in environment variables
2. **Never Hardcoded**: No API keys in source code
3. **Docker Secrets**: Use Docker secrets in production
4. **Key Rotation**: Rotate keys regularly

### Access Control

1. **Authentication Required**: All endpoints require JWT
2. **Rate Limiting**: Prevent abuse with rate limits
3. **Input Validation**: All inputs sanitized
4. **HTTPS Only**: Use HTTPS in production

### Best Practices

```javascript
// ✅ Good - Using environment variable
const apiKey = process.env.OPENROUTER_API_KEY;

// ❌ Bad - Hardcoded key
const apiKey = 'sk-or-v1-abc123...';

// ✅ Good - Secure headers
headers: {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
}

// ✅ Good - Input sanitization
const sanitizedCode = validator.escape(userCode);
```

## Performance

### Caching Strategy

**Cache TTL Values:**
- Hints: 3600s (1 hour)
- Explanations: 7200s (2 hours)
- Analysis: 1800s (30 minutes)
- Test Cases: 3600s (1 hour)

**Cache Keys:**
```
ai:hint:{problemId}:{withcode|nocode}
ai:explanation:{problemId}
ai:testcases:{problemId}
```

### Optimization Tips

1. **Use Caching**: Enable caching for repeated queries
2. **Batch Requests**: Group similar requests
3. **Optimize Prompts**: Keep prompts concise
4. **Monitor Usage**: Track token consumption
5. **Set Timeouts**: Configure appropriate timeouts

### Performance Metrics

| Operation | Avg Response Time | Cache Hit Rate |
|-----------|------------------|----------------|
| Get Hint | 2-5s | 85% |
| Explain Problem | 3-6s | 90% |
| Analyze Code | 4-8s | 0% (dynamic) |
| Generate Tests | 3-7s | 80% |

## Monitoring

### Usage Tracking

Track AI usage per user:
```javascript
// Automatic tracking
await aiService.trackUsage(userId, 'hint', usage);

// Get stats
const stats = await aiService.getUserUsageStats(userId, 30);
```

### Health Monitoring

```bash
# Check AI service health
curl http://localhost:8080/api/v1/health/detailed \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "services": {
    "openrouter": "healthy"
  },
  "ai": {
    "status": "healthy",
    "modelsAvailable": 50
  }
}
```

### Metrics to Monitor

1. **Request Count**: Total AI requests
2. **Token Usage**: Total tokens consumed
3. **Error Rate**: Failed requests percentage
4. **Response Time**: Average latency
5. **Cache Hit Rate**: Cache effectiveness
6. **Cost**: Estimated API costs

## Testing

### Postman Collection

Import this collection to test all endpoints:

```json
{
  "info": {
    "name": "OpenRouter AI API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Hint",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"code\": \"function solve() {}\"}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/ai/hint/{{problemId}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "ai", "hint", "{{problemId}}"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8080"
    },
    {
      "key": "token",
      "value": "your_jwt_token"
    },
    {
      "key": "problemId",
      "value": "problem123"
    }
  ]
}
```

### Unit Tests

```javascript
describe('AI Service', () => {
  it('should generate hint for problem', async () => {
    const result = await aiService.getHint('problem123', 'user123');
    expect(result.success).toBe(true);
    expect(result.content).toBeDefined();
  });

  it('should cache hint responses', async () => {
    const result1 = await aiService.getHint('problem123', 'user123');
    const result2 = await aiService.getHint('problem123', 'user123');
    expect(result2.cached).toBe(true);
  });

  it('should track usage', async () => {
    await aiService.getHint('problem123', 'user123');
    const stats = await aiService.getUserUsageStats('user123', 1);
    expect(stats.totalRequests).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Common Issues

#### 1. API Key Not Working

**Error:**
```
OPENROUTER_API_KEY environment variable is required
```

**Solution:**
```bash
# Set environment variable
export OPENROUTER_API_KEY="your_key_here"

# Or in .env file
echo "OPENROUTER_API_KEY=your_key_here" >> .env

# Restart services
docker-compose restart app
```

#### 2. Rate Limit Exceeded

**Error:**
```json
{
  "success": false,
  "error": "Rate limit exceeded"
}
```

**Solution:**
- Wait for rate limit to reset
- Implement request queuing
- Upgrade OpenRouter plan

#### 3. Timeout Errors

**Error:**
```
timeout of 30000ms exceeded
```

**Solution:**
```env
# Increase timeout
OPENROUTER_TIMEOUT=60000
```

#### 4. Cache Not Working

**Check Redis:**
```bash
docker exec -it leetcode-redis redis-cli -a redispass123
> KEYS ai:*
> GET ai:hint:problem123:nocode
```

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
```

View logs:
```bash
docker-compose logs -f app | grep OpenRouter
```

## Cost Optimization

### Reduce API Costs

1. **Enable Caching**: Cache responses aggressively
2. **Optimize Prompts**: Use concise prompts
3. **Set Token Limits**: Limit max_tokens parameter
4. **Monitor Usage**: Track and alert on high usage
5. **Use Cheaper Models**: Switch to cost-effective models

### Cost Estimation

```javascript
// Estimate cost per request
const COST_PER_1K_TOKENS = 0.003; // Example rate

function estimateCost(tokens) {
  return (tokens / 1000) * COST_PER_1K_TOKENS;
}

// Track monthly costs
const stats = await aiService.getUserUsageStats(userId, 30);
const monthlyCost = estimateCost(stats.totalTokens);
console.log(`Estimated monthly cost: $${monthlyCost.toFixed(2)}`);
```

## Production Checklist

- [ ] API key stored securely
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Caching enabled
- [ ] Monitoring set up
- [ ] Error handling tested
- [ ] Usage tracking implemented
- [ ] Cost alerts configured
- [ ] Backup API key ready
- [ ] Documentation updated

## Support

For issues or questions:
- OpenRouter Docs: https://openrouter.ai/docs
- GitHub Issues: [Your repo]
- Email: support@yourapp.com

## License

This integration is part of the LeetCode Clone project.
