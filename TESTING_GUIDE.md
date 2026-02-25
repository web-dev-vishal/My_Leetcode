# Testing Guide

## Quick Test

### 1. Start All Services

```bash
docker-compose up -d --build
```

### 2. Check Service Health

```bash
# Check all services
docker-compose ps

# Should show all services as healthy:
# - leetcode-mongodb
# - leetcode-redis
# - leetcode-rabbitmq
# - leetcode-app
# - leetcode-worker (x2 replicas)
```

### 3. View Logs

```bash
# App logs
docker-compose logs -f app

# Worker logs
docker-compose logs -f worker

# All logs
docker-compose logs -f
```

## API Testing

### 1. Register User

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the token from the response.

### 3. Submit Code for Execution

```bash
curl -X POST http://localhost:8080/api/v1/execute-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "source_code": "print(\"Hello World\")",
    "language_id": 71,
    "stdin": [""],
    "expected_outputs": ["Hello World"],
    "problemId": "PROBLEM_ID"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Code execution queued",
  "submissionId": "uuid-here",
  "status": "queued"
}
```

### 4. Check Submission Status

```bash
curl http://localhost:8080/api/v1/execute-code/status/SUBMISSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Socket.IO Testing

### Using wscat

```bash
npm install -g wscat

wscat -c "ws://localhost:8080" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using JavaScript Client

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:8080', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('submission:completed', (data) => {
  console.log('Submission completed:', data);
});

socket.emit('ping');

socket.on('pong', (data) => {
  console.log('Pong received:', data);
});
```

## Redis Testing

### Connect to Redis

```bash
docker exec -it leetcode-redis redis-cli -a redispass123
```

### Check Keys

```redis
# List all keys
KEYS *

# Get submission status
GET submission:SUBMISSION_ID:status

# Check pub/sub channels
PUBSUB CHANNELS
```

## RabbitMQ Testing

### Access Management UI

Open http://localhost:15672 in your browser

- Username: `admin`
- Password: `rabbitmqpass123`

### Check Queues

```bash
docker exec -it leetcode-rabbitmq rabbitmqctl list_queues
```

### Publish Test Message

```bash
docker exec -it leetcode-rabbitmq rabbitmqadmin publish \
  exchange=amq.default \
  routing_key=code_execution \
  payload='{"test": "message"}'
```

## Load Testing

### Using Artillery

Install Artillery:
```bash
npm install -g artillery
```

Create `load-test.yml`:
```yaml
config:
  target: "http://localhost:8080"
  phases:
    - duration: 60
      arrivalRate: 10
  processor: "./auth-processor.js"

scenarios:
  - name: "Code Execution"
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          capture:
            - json: "$.token"
              as: "token"
      - post:
          url: "/api/v1/execute-code"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            source_code: "print('test')"
            language_id: 71
            stdin: [""]
            expected_outputs: ["test"]
            problemId: "test-problem"
```

Run:
```bash
artillery run load-test.yml
```

### Using k6

Install k6 and create `load-test.js`:
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const loginRes = http.post('http://localhost:8080/api/v1/auth/login', 
    JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const token = loginRes.json('token');

  const codeRes = http.post('http://localhost:8080/api/v1/execute-code',
    JSON.stringify({
      source_code: 'print("test")',
      language_id: 71,
      stdin: [''],
      expected_outputs: ['test'],
      problemId: 'test-problem'
    }),
    { headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }}
  );

  check(codeRes, {
    'status is 202': (r) => r.status === 202,
  });
}
```

Run:
```bash
k6 run load-test.js
```

## Performance Monitoring

### Check Queue Stats

```bash
# Queue message count
docker exec -it leetcode-rabbitmq rabbitmqctl list_queues name messages

# Consumer count
docker exec -it leetcode-rabbitmq rabbitmqctl list_consumers
```

### Check Redis Stats

```bash
docker exec -it leetcode-redis redis-cli -a redispass123 INFO stats
```

### Check Worker Performance

```bash
# CPU and memory usage
docker stats leetcode-worker

# Number of workers
docker-compose ps worker
```

## Troubleshooting Tests

### Worker Not Processing Jobs

```bash
# Check worker logs
docker-compose logs worker

# Check RabbitMQ connection
docker exec -it leetcode-rabbitmq rabbitmqctl list_connections

# Restart workers
docker-compose restart worker
```

### Socket.IO Not Connecting

```bash
# Check app logs
docker-compose logs app

# Check Redis connection
docker exec -it leetcode-redis redis-cli -a redispass123 PING

# Test WebSocket
wscat -c ws://localhost:8080
```

### Redis Connection Issues

```bash
# Check Redis logs
docker-compose logs redis

# Test connection
docker exec -it leetcode-redis redis-cli -a redispass123 PING

# Check memory usage
docker exec -it leetcode-redis redis-cli -a redispass123 INFO memory
```

## Integration Tests

Create `tests/integration/code-execution.test.js`:

```javascript
import { expect } from 'chai';
import io from 'socket.io-client';
import axios from 'axios';

describe('Code Execution Integration', () => {
  let token;
  let socket;

  before(async () => {
    // Login
    const res = await axios.post('http://localhost:8080/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    token = res.data.token;

    // Connect socket
    socket = io('http://localhost:8080', {
      auth: { token }
    });

    await new Promise(resolve => socket.on('connect', resolve));
  });

  it('should execute code and receive real-time update', (done) => {
    socket.on('submission:completed', (data) => {
      expect(data).to.have.property('submissionId');
      expect(data).to.have.property('status');
      done();
    });

    axios.post('http://localhost:8080/api/v1/execute-code', {
      source_code: 'print("Hello")',
      language_id: 71,
      stdin: [''],
      expected_outputs: ['Hello'],
      problemId: 'test-problem'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }).timeout(30000);

  after(() => {
    socket.close();
  });
});
```

Run:
```bash
npm test
```

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes (deletes all data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```
