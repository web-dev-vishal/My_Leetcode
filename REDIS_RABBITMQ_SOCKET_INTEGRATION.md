# Redis, RabbitMQ & Socket.IO Integration

## Architecture Overview

This integration implements a scalable, production-ready architecture with:

- **Redis**: Caching, session management, pub/sub messaging
- **RabbitMQ**: Asynchronous task queues with retry logic
- **Socket.IO**: Real-time bidirectional communication with Redis adapter

## Components

### 1. Redis Integration

**Location**: `src/lib/redis.js`

**Features**:
- Singleton pattern for connection management
- Automatic reconnection with exponential backoff
- Separate clients for pub/sub operations
- Connection pooling and error handling
- TTL support for cache entries

**Usage**:
```javascript
import { redisManager } from './lib/redis.js';

// Set with TTL
await redisManager.set('key', { data: 'value' }, 300);

// Get
const data = await redisManager.get('key');

// Publish
await redisManager.publish('channel', { message: 'data' });

// Subscribe
await redisManager.subscribe('channel', (message) => {
  console.log('Received:', message);
});
```

**Configuration**:
```env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redispass123
```

### 2. RabbitMQ Integration

**Location**: `src/lib/rabbitmq.js`

**Features**:
- Automatic reconnection on connection loss
- Dead letter queues for failed messages
- Retry logic with exponential backoff (max 3 retries)
- Message acknowledgment
- Prefetch limit for load balancing

**Queues**:
- `code_execution`: Main queue for code execution jobs
- `code_execution_dlq`: Dead letter queue for failed jobs
- `notifications`: Queue for notification messages

**Usage**:
```javascript
import { rabbitMQ } from './lib/rabbitmq.js';

// Publish message
await rabbitMQ.publish('code_execution', {
  userId: '123',
  code: 'console.log("hello")',
});

// Consume messages
await rabbitMQ.consume('code_execution', async (message) => {
  // Process message
  console.log('Processing:', message);
});
```

**Configuration**:
```env
RABBITMQ_URL=amqp://admin:rabbitmqpass123@rabbitmq:5672
```

### 3. Socket.IO Integration

**Location**: `src/lib/socket.js`

**Features**:
- JWT authentication middleware
- Redis adapter for horizontal scaling
- Namespace support (`/submissions`, `/leaderboard`)
- Room management
- Automatic reconnection handling
- Connection lifecycle management

**Namespaces**:
- `/` (default): General real-time communication
- `/submissions`: Submission status updates
- `/leaderboard`: Leaderboard updates

**Usage**:
```javascript
import { socketManager } from './lib/socket.js';

// Emit to specific user
socketManager.emitToUser(userId, 'submission:completed', data);

// Emit to room
socketManager.emitToRoom('leaderboard', 'update', data);

// Broadcast to all
socketManager.broadcast('announcement', data);
```

**Client Connection**:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:8080', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('submission:completed', (data) => {
  console.log('Submission completed:', data);
});
```

### 4. Worker Process

**Location**: `src/workers/index.js`, `src/workers/codeExecutionWorker.js`

**Features**:
- Separate process for background jobs
- Consumes messages from RabbitMQ
- Processes code execution asynchronously
- Updates Redis with job status
- Publishes completion events

**Deployment**:
The worker runs as a separate container in docker-compose with 2 replicas for load balancing.

## Code Execution Flow

1. **Client submits code** → POST `/api/v1/execute-code`
2. **API creates job** → Publishes to RabbitMQ `code_execution` queue
3. **API stores status** → Redis `submission:{id}:status = 'queued'`
4. **API responds** → 202 Accepted with `submissionId`
5. **Worker picks up job** → Consumes from RabbitMQ
6. **Worker processes** → Calls Judge0 API
7. **Worker saves result** → MongoDB + Redis cache
8. **Worker publishes event** → Redis pub/sub `submission:completed`
9. **Socket.IO emits** → Real-time update to client
10. **Client polls status** → GET `/api/v1/execute-code/status/:submissionId`

## Security

### Redis
- Password authentication enabled
- Connection over private Docker network
- No external exposure in production

### RabbitMQ
- Username/password authentication
- Management UI on port 15672 (disable in production)
- TLS support (configure for production)

### Socket.IO
- JWT authentication required
- CORS configuration
- Namespace-level authorization

## Monitoring

### Health Checks
All services have health checks in docker-compose:
- MongoDB: `mongosh ping`
- Redis: `redis-cli ping`
- RabbitMQ: `rabbitmq-diagnostics ping`

### Logging
Winston logger with:
- Console output (development)
- File output (production)
- Error and combined logs
- Structured JSON format

### Metrics
Monitor these endpoints:
- RabbitMQ Management: http://localhost:15672
- Redis: Use `redis-cli INFO`

## Scaling

### Horizontal Scaling
1. **Multiple app instances**: Socket.IO uses Redis adapter for message sync
2. **Multiple workers**: RabbitMQ distributes jobs across workers
3. **Redis cluster**: Configure Redis Cluster for high availability
4. **RabbitMQ cluster**: Set up RabbitMQ cluster for fault tolerance

### Load Balancing
```yaml
worker:
  deploy:
    replicas: 3  # Scale workers
```

## Error Handling

### Retry Logic
- Failed messages retry 3 times with exponential backoff
- After 3 failures, moved to dead letter queue
- Manual intervention required for DLQ messages

### Graceful Shutdown
Both app and worker handle:
- SIGTERM
- SIGINT
- Uncaught exceptions
- Unhandled promise rejections

Shutdown sequence:
1. Stop accepting new connections
2. Finish processing current jobs
3. Close RabbitMQ connection
4. Close Redis connection
5. Close Socket.IO
6. Exit process

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
Use tools like:
- Artillery for HTTP/WebSocket load testing
- RabbitMQ PerfTest for queue performance

## Deployment

### Development
```bash
docker-compose up -d --build
```

### Production Checklist
- [ ] Change default passwords
- [ ] Enable TLS for Redis
- [ ] Enable TLS for RabbitMQ
- [ ] Configure CORS properly
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation (ELK stack)
- [ ] Set resource limits
- [ ] Enable Redis persistence
- [ ] Configure RabbitMQ clustering
- [ ] Set up backup strategy

### Environment Variables
```env
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb://admin:admin@db:27017/leetcode?authSource=admin
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
RABBITMQ_URL=amqp://admin:your-secure-password@rabbitmq:5672
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

## Troubleshooting

### Redis Connection Issues
```bash
# Check Redis logs
docker-compose logs redis

# Test connection
docker exec -it leetcode-redis redis-cli -a redispass123 ping
```

### RabbitMQ Issues
```bash
# Check RabbitMQ logs
docker-compose logs rabbitmq

# Check queue status
docker exec -it leetcode-rabbitmq rabbitmqctl list_queues
```

### Socket.IO Issues
```bash
# Check app logs
docker-compose logs app

# Test WebSocket connection
wscat -c ws://localhost:8080 -H "Authorization: Bearer YOUR_TOKEN"
```

### Worker Issues
```bash
# Check worker logs
docker-compose logs worker

# Scale workers
docker-compose up -d --scale worker=3
```

## Performance Tuning

### Redis
```bash
# Increase max memory
maxmemory 512mb

# Set eviction policy
maxmemory-policy allkeys-lru
```

### RabbitMQ
```bash
# Increase prefetch count
channel.prefetch(20)

# Enable lazy queues for large queues
x-queue-mode: lazy
```

### Socket.IO
```javascript
// Increase ping timeout
pingTimeout: 60000

// Use WebSocket only
transports: ['websocket']
```

## Best Practices

1. **Always use connection pooling** for Redis and RabbitMQ
2. **Implement circuit breakers** for external services
3. **Use message TTL** to prevent queue buildup
4. **Monitor queue depths** and set alerts
5. **Implement rate limiting** on Socket.IO connections
6. **Use namespaces** to organize Socket.IO events
7. **Cache frequently accessed data** in Redis
8. **Set appropriate TTLs** for cached data
9. **Use dead letter queues** for failed messages
10. **Implement proper logging** for debugging

## Additional Resources

- [Redis Documentation](https://redis.io/documentation)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Winston Logger](https://github.com/winstonjs/winston)
