# Docker Setup Guide

## Overview

This project uses Docker Compose to run the following services:
- **Redis** - Caching and session storage
- **RabbitMQ** - Message queue for code execution
- **MongoDB** - Database (runs locally, not in Docker)

## Prerequisites

### 1. Install Docker Desktop
Download and install Docker Desktop for Windows:
- https://www.docker.com/products/docker-desktop/

### 2. Install MongoDB Locally
Download and install MongoDB Community Edition:
- https://www.mongodb.com/try/download/community

**Installation Steps:**
1. Download MongoDB installer
2. Run installer (choose "Complete" installation)
3. Install as Windows Service (recommended)
4. MongoDB Compass will be installed automatically

**Verify MongoDB is running:**
```bash
# Check if MongoDB service is running
mongosh
# You should see MongoDB shell prompt
```

## Configuration

### Local Development (.env file)
```env
PORT=8080
MONGODB_URI="mongodb://localhost:27017/leetcode"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="redispass123"
RABBITMQ_URL="amqp://admin:rabbitmqpass123@localhost:5672"
```

### Docker Services
The docker-compose.yml runs:
- Redis on port 6379
- RabbitMQ on ports 5672 (AMQP) and 15672 (Management UI)

MongoDB runs locally on port 27017 (not in Docker).

## Usage

### Start Services

#### Option 1: Run Everything in Docker (App + Workers + Redis + RabbitMQ)
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f app
docker compose logs -f worker
```

#### Option 2: Run Only Infrastructure (Redis + RabbitMQ)
```bash
# Start only Redis and RabbitMQ
docker compose up -d redis rabbitmq

# Run app locally
npm run dev

# Run worker locally (in another terminal)
node src/workers/index.js
```

### Stop Services
```bash
# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Restart Services
```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart app
docker compose restart worker
```

### View Service Status
```bash
# Check running containers
docker compose ps

# Check service health
docker compose ps --format json
```

## Service Details

### Redis
- **Port:** 6379
- **Password:** redispass123
- **Max Memory:** 256MB
- **Eviction Policy:** allkeys-lru

**Access Redis CLI:**
```bash
docker compose exec redis redis-cli -a redispass123
```

### RabbitMQ
- **AMQP Port:** 5672
- **Management UI:** http://localhost:15672
- **Username:** admin
- **Password:** rabbitmqpass123

**Access Management UI:**
Open browser: http://localhost:15672
Login with admin/rabbitmqpass123

### MongoDB (Local)
- **Port:** 27017
- **Database:** leetcode
- **No authentication** (local development)

**Access MongoDB:**
```bash
# Using mongosh
mongosh mongodb://localhost:27017/leetcode

# Using MongoDB Compass
# Connect to: mongodb://localhost:27017
```

## Worker Scaling

The worker service runs with 2 replicas by default for parallel code execution.

**To change worker count:**
Edit docker-compose.yml:
```yaml
worker:
  deploy:
    replicas: 3  # Change to desired number
```

Then restart:
```bash
docker compose up -d --scale worker=3
```

## Troubleshooting

### Issue: "container_name and replicas conflict"
**Solution:** Fixed! The worker service no longer has `container_name` when using replicas.

### Issue: MongoDB connection failed
**Solution:**
1. Check MongoDB is running locally:
   ```bash
   mongosh
   ```
2. Verify MongoDB service in Windows Services
3. Check connection string in .env file

### Issue: Redis connection failed
**Solution:**
```bash
# Check Redis is running
docker compose ps redis

# Restart Redis
docker compose restart redis

# Check Redis logs
docker compose logs redis
```

### Issue: RabbitMQ connection failed
**Solution:**
```bash
# Check RabbitMQ is running
docker compose ps rabbitmq

# Restart RabbitMQ
docker compose restart rabbitmq

# Check RabbitMQ logs
docker compose logs rabbitmq
```

### Issue: Worker not processing jobs
**Solution:**
```bash
# Check worker logs
docker compose logs worker

# Restart workers
docker compose restart worker

# Check RabbitMQ queue
# Open http://localhost:15672 and check "Queues" tab
```

### Issue: Port already in use
**Solution:**
```bash
# Check what's using the port
netstat -ano | findstr :8080
netstat -ano | findstr :6379
netstat -ano | findstr :5672

# Kill the process or change port in docker-compose.yml
```

## Development Workflow

### Recommended Setup for Development:

1. **Start infrastructure services:**
   ```bash
   docker compose up -d redis rabbitmq
   ```

2. **Run app locally:**
   ```bash
   npm run dev
   ```

3. **Run worker locally (optional):**
   ```bash
   node src/workers/index.js
   ```

This allows hot-reloading and easier debugging.

### Production-like Testing:

1. **Build and start everything:**
   ```bash
   docker compose up -d --build
   ```

2. **Test the API:**
   ```bash
   curl http://localhost:8080/api/v1/health
   ```

## Environment Variables

### For Local Development (npm run dev)
Uses `.env` file:
- MongoDB: localhost:27017
- Redis: localhost:6379
- RabbitMQ: localhost:5672

### For Docker (docker compose up)
Uses environment variables in docker-compose.yml:
- MongoDB: host.docker.internal:27017 (connects to local MongoDB)
- Redis: redis:6379 (Docker service)
- RabbitMQ: rabbitmq:5672 (Docker service)

## Useful Commands

```bash
# View all containers
docker compose ps

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f app
docker compose logs -f worker
docker compose logs -f redis
docker compose logs -f rabbitmq

# Execute command in container
docker compose exec app sh
docker compose exec redis redis-cli -a redispass123

# Rebuild containers
docker compose build
docker compose up -d --build

# Remove all containers and volumes
docker compose down -v

# Check resource usage
docker stats

# Clean up Docker system
docker system prune -a
```

## Health Checks

All services have health checks configured:

- **Redis:** Pings every 10s
- **RabbitMQ:** Diagnostics check every 10s

Check health status:
```bash
docker compose ps
```

Healthy services show "healthy" in the STATUS column.

## Monitoring

### RabbitMQ Management UI
- URL: http://localhost:15672
- Username: admin
- Password: rabbitmqpass123

**Features:**
- View queues and messages
- Monitor connections
- Check consumer status
- View exchange bindings

### Redis Monitoring
```bash
# Connect to Redis CLI
docker compose exec redis redis-cli -a redispass123

# Monitor commands
MONITOR

# Get info
INFO

# Check memory usage
INFO memory

# List all keys
KEYS *
```

### MongoDB Monitoring
Use MongoDB Compass:
- Connect to: mongodb://localhost:27017
- View collections, documents, and indexes
- Run queries and aggregations

## Backup and Restore

### Redis Backup
```bash
# Redis data is stored in Docker volume
docker compose exec redis redis-cli -a redispass123 SAVE
```

### RabbitMQ Backup
```bash
# Export definitions
curl -u admin:rabbitmqpass123 http://localhost:15672/api/definitions > rabbitmq-backup.json
```

### MongoDB Backup
```bash
# Backup database
mongodump --db leetcode --out ./backup

# Restore database
mongorestore --db leetcode ./backup/leetcode
```

## Performance Tuning

### Redis
Edit docker-compose.yml:
```yaml
redis:
  command: redis-server --requirepass redispass123 --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Worker Scaling
Increase workers for better throughput:
```yaml
worker:
  deploy:
    replicas: 4  # More workers = more parallel execution
```

### RabbitMQ
For high load, adjust prefetch count in your worker code.

## Security Notes

**For Production:**
1. Change all default passwords
2. Use environment variables for secrets
3. Enable TLS/SSL
4. Restrict network access
5. Use Docker secrets
6. Enable authentication on MongoDB

**Current Setup (Development Only):**
- Simple passwords (change for production)
- No TLS/SSL
- Open ports
- No MongoDB authentication

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Redis Documentation](https://redis.io/documentation)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [MongoDB Documentation](https://docs.mongodb.com/)
