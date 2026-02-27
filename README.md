# LeetCode Clone Backend

A scalable coding platform backend with Node.js, Express, MongoDB, Redis, RabbitMQ, and Socket.IO.

## Features

- User authentication with JWT
- Problem management (CRUD operations)
- Asynchronous code execution using Judge0 API
- Real-time submission updates via WebSocket
- Message queue for background job processing
- Redis caching for improved performance
- Rate limiting to prevent abuse
- Global leaderboard system
- Real-time notifications
- Analytics and statistics tracking
- Health monitoring endpoints
- Submission tracking with detailed results
- Playlist system for organizing problems

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Real-time**: Socket.IO with Redis adapter
- **Code Execution**: Judge0 API
- **Logging**: Winston
- **Containerization**: Docker & Docker Compose

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP/WebSocket
       ▼
┌─────────────┐     ┌─────────────┐
│  Express    │────▶│  Socket.IO  │
│   Server    │     │  (Redis)    │
└──────┬──────┘     └─────────────┘
       │
       ├──▶ MongoDB (Data)
       ├──▶ Redis (Cache/Pub-Sub)
       └──▶ RabbitMQ (Jobs)
              │
              ▼
       ┌─────────────┐
       │   Workers   │
       │  (2 replicas)│
       └─────────────┘
```

## Services

- **app**: Main API server with Socket.IO
- **worker**: Background job processor (2 replicas)
- **db**: MongoDB database
- **redis**: Redis cache and pub/sub
- **rabbitmq**: Message queue with management UI

## Requirements

- Docker
- Docker Compose

## Quick Start

```bash
# Build and start all services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## API Endpoints

### Authentication
- POST `/api/v1/auth/register` - Register user
- POST `/api/v1/auth/login` - Login user
- POST `/api/v1/auth/logout` - Logout user

### Problems
- GET `/api/v1/problems` - List problems
- GET `/api/v1/problems/:id` - Get problem
- POST `/api/v1/problems` - Create problem (admin)
- PUT `/api/v1/problems/:id` - Update problem (admin)
- DELETE `/api/v1/problems/:id` - Delete problem (admin)

### Code Execution (Async)
- POST `/api/v1/execute-code` - Submit code (returns submissionId)
- GET `/api/v1/execute-code/status/:submissionId` - Check status

### Submissions
- GET `/api/v1/submission` - Get user submissions
- GET `/api/v1/submission/:id` - Get submission details

### Playlists
- GET `/api/v1/playlist` - List playlists
- POST `/api/v1/playlist` - Create playlist
- GET `/api/v1/playlist/:id` - Get playlist
- PUT `/api/v1/playlist/:id` - Update playlist
- DELETE `/api/v1/playlist/:id` - Delete playlist

### Leaderboard (New)
- GET `/api/v1/leaderboard` - Get global leaderboard
- GET `/api/v1/leaderboard/rank` - Get user rank
- GET `/api/v1/leaderboard/stats/:userId` - Get user statistics

### API Explorer (New)
- GET `/api/v1/public-apis/catalog` - List all APIs (optional `?category=`)
- GET `/api/v1/public-apis/catalog/categories` - List categories
- GET `/api/v1/public-apis/catalog/:apiName` - Get API details + endpoints
- POST `/api/v1/public-apis/test/execute` - Execute single endpoint test
- POST `/api/v1/public-apis/test/batch` - Batch test all endpoints for an API
- POST `/api/v1/public-apis/test/custom` - Execute custom/freeform request
- GET `/api/v1/public-apis/health` - API integration health

### Health (New)
- GET `/api/v1/health` - Basic health check
- GET `/api/v1/health/detailed` - Detailed system health

## API Explorer

The project includes a **reusable API Explorer** for browsing and testing 6 curated public REST APIs (no weather).

### Curated APIs

| API | Category | Auth | Endpoints | Base URL |
|-----|----------|------|-----------|----------|
| PoetryDB | Books | None | 3 | `https://poetrydb.org` |
| Gutendex | Books | None | 3 | `https://gutendex.com` |
| NASA APOD | Science | DEMO_KEY | 3 | `https://api.nasa.gov` |
| Numbers API | Science | None | 3 | `http://numbersapi.com` |

### Quick Test

```bash

# Execute endpoint test
curl -X POST http://localhost:8080/api/v1/public-apis/test/execute \
  -H "Content-Type: application/json" \
  -d '{"apiName": "dog-ceo", "endpointIndex": 0}'

# Batch test all endpoints
curl -X POST http://localhost:8080/api/v1/public-apis/test/batch \
  -H "Content-Type: application/json" \
  -d '{"apiName": "poetrydb"}'

# Custom request
curl -X POST http://localhost:8080/api/v1/public-apis/test/custom \
  -H "Content-Type: application/json" \
  -d '{"method": "GET", "url": "https://catfact.ninja/fact"}'
```

### How to Add a New API

1. Open `src/lib/publicApi/apiRegistry.js`
2. Add a `registerAPI()` call in `_loadFreeAPIs()`:
   ```js
   this.registerAPI({
     name: 'my-api',
     displayName: 'My API',
     category: 'animals', // or any valid category
     baseURL: 'https://api.example.com',
     auth: { type: 'none' },
     timeout: 10000,
     rateLimit: { maxRequests: 100, windowSeconds: 60 },
     cache: { enabled: true, ttl: 300 },
     retry: { enabled: true, maxAttempts: 3, backoffMs: 1000 },
     health: { enabled: true, endpoint: '/ping', intervalSeconds: 300 },
     metadata: { description: 'My API description', documentation: 'https://docs.example.com', version: '1.0' },
     endpoints: [
       { method: 'GET', path: '/data', description: 'Get data' },
     ]
   });
   ```
3. Restart the server — the new API appears in `/api/v1/public-apis/catalog`

### Postman Collection

Import `postman/explorer_collection.json` into Postman (14 requests with test scripts).

## WebSocket Events

### Client → Server
- `ping` - Heartbeat check

### Server → Client
- `pong` - Heartbeat response
- `submission:completed` - Code execution completed
- `notification` - User notifications (new)
- `leaderboard:update` - Leaderboard updates (new)
- `announcement` - System announcements (new)

### Namespaces
- `/` - Default namespace
- `/submissions` - Submission updates
- `/leaderboard` - Leaderboard updates

## Code Execution Flow

1. Client submits code → API returns `submissionId` (202 Accepted)
2. Job queued in RabbitMQ
3. Worker picks up job and processes
4. Result saved to MongoDB and cached in Redis
5. Real-time update sent via Socket.IO
6. Client polls status endpoint or receives WebSocket event

## Environment Variables

```env
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb://admin:admin@db:27017/leetcode?authSource=admin
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redispass123
RABBITMQ_URL=amqp://admin:rabbitmqpass123@rabbitmq:5672
JWT_SECRET=your-jwt-secret
RAPIDAPI_KEY=your-rapidapi-key
RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
CORS_ORIGIN=*
LOG_LEVEL=info
```

## Management UIs

- **RabbitMQ Management**: http://localhost:15672
  - Username: `admin`
  - Password: `rabbitmqpass123`

## Monitoring

```bash
# Service health
docker-compose ps

# App logs
docker-compose logs -f app

# Worker logs
docker-compose logs -f worker

# Redis stats
docker exec -it leetcode-redis redis-cli -a redispass123 INFO

# RabbitMQ queues
docker exec -it leetcode-rabbitmq rabbitmqctl list_queues

# Container stats
docker stats
```

## Scaling

### Scale Workers
```bash
docker-compose up -d --scale worker=5
```

### Multiple App Instances
Socket.IO uses Redis adapter for message synchronization across instances.

## Testing

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing instructions.

Quick test:
```bash
# Register user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","name":"Test"}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'

# Submit code
curl -X POST http://localhost:8080/api/v1/execute-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "source_code": "print(\"Hello\")",
    "language_id": 71,
    "stdin": [""],
    "expected_outputs": ["Hello"],
    "problemId": "test"
  }'
```

## Documentation

- [Advanced Features](ADVANCED_FEATURES.md) - New features documentation
- [Redis, RabbitMQ & Socket.IO Integration](REDIS_RABBITMQ_SOCKET_INTEGRATION.md)
- [Testing Guide](TESTING_GUIDE.md)
- [Docker Setup](DOCKER_SETUP.md)
- [Migration Summary](MIGRATION_SUMMARY.md)

## Project Structure

```
src/
├── controllers/    # Request handlers
├── models/        # Mongoose schemas
├── routes/        # API routes
├── middlewares/   # Auth, error handling
├── lib/          # Core services
│   ├── db.js           # MongoDB connection
│   ├── redis.js        # Redis manager
│   ├── rabbitmq.js     # RabbitMQ manager
│   ├── socket.js       # Socket.IO manager
│   ├── logger.js       # Winston logger
│   └── judge0.js       # Judge0 integration
├── workers/       # Background workers
│   ├── index.js                  # Worker entry point
│   └── codeExecutionWorker.js    # Code execution processor
└── index.js       # App entry point
```

## Troubleshooting

### Services won't start
```bash
docker-compose down -v
docker-compose up -d --build
```

### Worker not processing jobs
```bash
docker-compose logs worker
docker-compose restart worker
```

### Redis connection issues
```bash
docker exec -it leetcode-redis redis-cli -a redispass123 PING
```

### RabbitMQ connection issues
```bash
docker exec -it leetcode-rabbitmq rabbitmqctl status
```

## Production Checklist

- [ ] Change all default passwords
- [ ] Enable TLS for Redis
- [ ] Enable TLS for RabbitMQ
- [ ] Configure proper CORS origins
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation
- [ ] Set resource limits in docker-compose
- [ ] Enable Redis persistence (AOF/RDB)
- [ ] Set up RabbitMQ clustering
- [ ] Configure backup strategy
- [ ] Disable RabbitMQ management UI
- [ ] Use secrets management (Docker secrets/Vault)

## License

ISC
