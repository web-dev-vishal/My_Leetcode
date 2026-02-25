# Quick Reference Card

## Start/Stop

```bash
# Start everything
docker-compose up -d --build

# Stop everything
docker-compose down

# Stop and delete data
docker-compose down -v
```

## Check Status

```bash
# All services
docker-compose ps

# Logs
docker-compose logs -f app
docker-compose logs -f worker
docker-compose logs -f redis
docker-compose logs -f rabbitmq
```

## Service URLs

- **API**: http://localhost:8080
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **RabbitMQ**: localhost:5672
- **RabbitMQ UI**: http://localhost:15672 (admin/rabbitmqpass123)

## Common Commands

### Redis
```bash
# Connect
docker exec -it leetcode-redis redis-cli -a redispass123

# Check keys
KEYS *

# Get value
GET submission:ID:status

# Monitor
MONITOR
```

### RabbitMQ
```bash
# List queues
docker exec -it leetcode-rabbitmq rabbitmqctl list_queues

# List connections
docker exec -it leetcode-rabbitmq rabbitmqctl list_connections

# Purge queue
docker exec -it leetcode-rabbitmq rabbitmqctl purge_queue code_execution
```

### MongoDB
```bash
# Connect
docker exec -it leetcode-mongodb mongosh -u admin -p admin

# Show databases
show dbs

# Use database
use leetcode

# Show collections
show collections
```

## API Testing

### Register
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","name":"Test"}'
```

### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'
```

### Submit Code
```bash
curl -X POST http://localhost:8080/api/v1/execute-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "source_code": "print(\"Hello\")",
    "language_id": 71,
    "stdin": [""],
    "expected_outputs": ["Hello"],
    "problemId": "test"
  }'
```

### Check Status
```bash
curl http://localhost:8080/api/v1/execute-code/status/SUBMISSION_ID \
  -H "Authorization: Bearer TOKEN"
```

### Get Leaderboard
```bash
curl http://localhost:8080/api/v1/leaderboard
```

### Get User Rank
```bash
curl http://localhost:8080/api/v1/leaderboard/rank \
  -H "Authorization: Bearer TOKEN"
```

### Health Check
```bash
curl http://localhost:8080/api/v1/health
```

## WebSocket Testing

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c "ws://localhost:8080" -H "Authorization: Bearer TOKEN"

# Send ping
> {"type":"ping"}

# Listen for events
< {"type":"submission:completed","data":{...}}
```

## Scaling

```bash
# Scale workers
docker-compose up -d --scale worker=5

# Check worker count
docker-compose ps worker
```

## Troubleshooting

### Restart Service
```bash
docker-compose restart app
docker-compose restart worker
docker-compose restart redis
docker-compose restart rabbitmq
```

### View Resource Usage
```bash
docker stats
```

### Clean Up
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## Environment Variables

```env
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb://admin:admin@db:27017/leetcode?authSource=admin
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redispass123
RABBITMQ_URL=amqp://admin:rabbitmqpass123@rabbitmq:5672
JWT_SECRET=your-secret
RAPIDAPI_KEY=your-key
RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
```

## Language IDs (Judge0)

- JavaScript: 63
- Python: 71
- Java: 62
- C++: 54
- TypeScript: 74

## Health Check

```bash
# API
curl http://localhost:8080

# Redis
docker exec -it leetcode-redis redis-cli -a redispass123 PING

# RabbitMQ
docker exec -it leetcode-rabbitmq rabbitmqctl status

# MongoDB
docker exec -it leetcode-mongodb mongosh --eval "db.adminCommand('ping')"
```

## Monitoring

### Queue Stats
```bash
docker exec -it leetcode-rabbitmq rabbitmqctl list_queues name messages consumers
```

### Redis Stats
```bash
docker exec -it leetcode-redis redis-cli -a redispass123 INFO stats
```

### Worker Performance
```bash
docker stats leetcode-worker
```

## Backup

### MongoDB
```bash
# Backup
docker exec leetcode-mongodb mongodump -u admin -p admin --authenticationDatabase admin -o /backup

# Restore
docker exec leetcode-mongodb mongorestore -u admin -p admin --authenticationDatabase admin /backup
```

### Redis
```bash
# Save snapshot
docker exec -it leetcode-redis redis-cli -a redispass123 SAVE

# Copy backup
docker cp leetcode-redis:/data/dump.rdb ./redis-backup.rdb
```

## Documentation

- [README.md](README.md) - Main documentation
- [REDIS_RABBITMQ_SOCKET_INTEGRATION.md](REDIS_RABBITMQ_SOCKET_INTEGRATION.md) - Integration guide
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing instructions
- [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md) - Implementation summary
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Docker guide
