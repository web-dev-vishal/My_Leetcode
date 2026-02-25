# Docker Commands Reference

## ✅ Fixed Issues

- **Removed** `container_name` from worker service (conflicts with replicas)
- **Updated** to use FREE model (`google/gemini-flash-1.5`)
- **Added** CORS_ORIGIN environment variable

---

## 🚀 Quick Start

### Build and Start All Services

```bash
docker-compose up --build
```

This will:
- Build the application image
- Start MongoDB, Redis, RabbitMQ
- Start the main app
- Start 2 worker instances

### Start in Background (Detached Mode)

```bash
docker-compose up -d --build
```

---

## 📊 Container Names

When running with replicas, Docker automatically names containers:

| Service | Container Names |
|---------|----------------|
| MongoDB | `leetcode-mongodb` |
| Redis | `leetcode-redis` |
| RabbitMQ | `leetcode-rabbitmq` |
| App | `leetcode-app` |
| Worker 1 | `leetcode-backend-api-worker-1` |
| Worker 2 | `leetcode-backend-api-worker-2` |

---

## 🔍 Monitoring Commands

### View All Running Containers

```bash
docker-compose ps
```

### View Logs (All Services)

```bash
docker-compose logs -f
```

### View Logs (Specific Service)

```bash
# App logs
docker-compose logs -f app

# Worker logs
docker-compose logs -f worker

# MongoDB logs
docker-compose logs -f db

# Redis logs
docker-compose logs -f redis

# RabbitMQ logs
docker-compose logs -f rabbitmq
```

### View Last 100 Lines

```bash
docker-compose logs --tail=100 app
```

---

## 🛠️ Management Commands

### Stop All Services

```bash
docker-compose down
```

### Stop and Remove Volumes (Clean Slate)

```bash
docker-compose down -v
```

### Restart Specific Service

```bash
# Restart app
docker-compose restart app

# Restart workers
docker-compose restart worker

# Restart all
docker-compose restart
```

### Scale Workers

```bash
# Scale to 3 workers
docker-compose up -d --scale worker=3

# Scale to 1 worker
docker-compose up -d --scale worker=1
```

### Rebuild Specific Service

```bash
# Rebuild app only
docker-compose build app

# Rebuild and restart app
docker-compose up -d --build app
```

---

## 🔧 Debugging Commands

### Execute Command in Container

```bash
# Access app container shell
docker exec -it leetcode-app sh

# Access MongoDB shell
docker exec -it leetcode-mongodb mongosh -u admin -p admin

# Access Redis CLI
docker exec -it leetcode-redis redis-cli -a redispass123

# Access worker container
docker exec -it leetcode-backend-api-worker-1 sh
```

### Check Container Health

```bash
docker-compose ps
```

Look for "healthy" status.

### Inspect Container

```bash
docker inspect leetcode-app
```

### View Container Resource Usage

```bash
docker stats
```

---

## 🧹 Cleanup Commands

### Remove Stopped Containers

```bash
docker-compose rm
```

### Remove All Unused Images

```bash
docker image prune -a
```

### Remove All Unused Volumes

```bash
docker volume prune
```

### Complete Cleanup

```bash
# Stop and remove everything
docker-compose down -v

# Remove all unused resources
docker system prune -a --volumes
```

---

## 🔄 Update and Redeploy

### After Code Changes

```bash
# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

### After Environment Variable Changes

```bash
# Just restart (no rebuild needed)
docker-compose down
docker-compose up -d
```

### After docker-compose.yml Changes

```bash
docker-compose down
docker-compose up -d
```

---

## 🏥 Health Checks

### Check Service Health

```bash
# All services
docker-compose ps

# Specific service
docker inspect leetcode-app | grep -A 10 Health
```

### Test Endpoints

```bash
# Health check
curl http://localhost:8080/api/v1/health

# Detailed health
curl http://localhost:8080/api/v1/health/detailed
```

---

## 📦 Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **API** | http://localhost:8080 | - |
| **MongoDB** | mongodb://localhost:27017 | admin / admin |
| **Redis** | redis://localhost:6379 | password: redispass123 |
| **RabbitMQ Management** | http://localhost:15672 | admin / rabbitmqpass123 |
| **RabbitMQ AMQP** | amqp://localhost:5672 | admin / rabbitmqpass123 |

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
ports:
  - "8081:8080"  # Use 8081 instead
```

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Check if dependencies are healthy
docker-compose ps
```

### Database Connection Issues

```bash
# Check MongoDB is running
docker-compose ps db

# Check MongoDB logs
docker-compose logs db

# Test connection
docker exec -it leetcode-mongodb mongosh -u admin -p admin
```

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker exec -it leetcode-redis redis-cli -a redispass123 ping
```

### RabbitMQ Connection Issues

```bash
# Check RabbitMQ is running
docker-compose ps rabbitmq

# Check RabbitMQ logs
docker-compose logs rabbitmq

# Access management UI
# Open: http://localhost:15672
```

### Worker Not Processing Jobs

```bash
# Check worker logs
docker-compose logs -f worker

# Check RabbitMQ queue
# Open: http://localhost:15672
# Login: admin / rabbitmqpass123
# Go to Queues tab
```

### Out of Memory

```bash
# Check resource usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Settings → Resources → Memory
```

---

## 🎯 Common Workflows

### Development Workflow

```bash
# 1. Start services
docker-compose up -d

# 2. View logs
docker-compose logs -f app

# 3. Make code changes

# 4. Rebuild and restart
docker-compose up -d --build app

# 5. Test changes
curl http://localhost:8080/api/v1/health
```

### Production Deployment

```bash
# 1. Pull latest code
git pull

# 2. Update environment variables
nano .env

# 3. Stop old containers
docker-compose down

# 4. Build and start
docker-compose up -d --build

# 5. Verify health
curl http://localhost:8080/api/v1/health/detailed

# 6. Monitor logs
docker-compose logs -f
```

### Scaling Workers

```bash
# Scale up during high load
docker-compose up -d --scale worker=5

# Scale down during low load
docker-compose up -d --scale worker=1
```

---

## 📊 Monitoring Production

### View Real-time Logs

```bash
# All services
docker-compose logs -f

# Only errors
docker-compose logs -f | grep -i error

# Only warnings
docker-compose logs -f | grep -i warn
```

### Check Resource Usage

```bash
# Real-time stats
docker stats

# Specific container
docker stats leetcode-app
```

### Check Disk Usage

```bash
# Docker disk usage
docker system df

# Detailed breakdown
docker system df -v
```

---

## 🔐 Security

### Update Passwords

Edit `docker-compose.yml` and change:
- MongoDB: `MONGO_INITDB_ROOT_PASSWORD`
- Redis: `--requirepass` in command
- RabbitMQ: `RABBITMQ_DEFAULT_PASS`

Then rebuild:
```bash
docker-compose down -v
docker-compose up -d --build
```

### Restrict Network Access

```bash
# Only expose app port (remove other port mappings)
# Edit docker-compose.yml and remove:
# - MongoDB port 27017
# - Redis port 6379
# - RabbitMQ ports 5672, 15672
```

---

## 📝 Quick Reference

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build

# Logs
docker-compose logs -f

# Status
docker-compose ps

# Restart
docker-compose restart

# Scale workers
docker-compose up -d --scale worker=3

# Clean up
docker-compose down -v
```

---

## ✅ Verification Checklist

After starting services, verify:

- [ ] All containers running: `docker-compose ps`
- [ ] All services healthy: Check "State" column
- [ ] API responding: `curl http://localhost:8080/api/v1/health`
- [ ] MongoDB connected: Check health endpoint
- [ ] Redis connected: Check health endpoint
- [ ] RabbitMQ connected: Check health endpoint
- [ ] Workers processing: Check worker logs
- [ ] No errors in logs: `docker-compose logs`

---

**Your services are now running with 2 worker instances for better performance!** 🚀
