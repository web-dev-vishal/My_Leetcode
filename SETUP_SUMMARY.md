# Setup Summary - Issues Fixed

## ✅ Issues Resolved

### 1. Docker Compose Error Fixed
**Problem:** 
```
services.deploy.replicas: can't set container_name and worker as container name must be unique
```

**Solution:**
- Removed `container_name: leetcode-worker` from worker service
- Worker service now uses `deploy.replicas: 2` without container_name
- Each worker replica gets a unique auto-generated name

### 2. MongoDB Configuration Changed
**Problem:** MongoDB was running in Docker, but you wanted it to run locally

**Solution:**
- Removed MongoDB service from docker-compose.yml
- Updated all MongoDB connection strings to use `host.docker.internal:27017` (for Docker containers)
- Updated .env file to use `localhost:27017` (for local development)
- Removed MongoDB volume from docker-compose.yml

---

## 📋 What Changed

### docker-compose.yml Changes:
1. ✅ Removed entire `db` (MongoDB) service
2. ✅ Removed `container_name` from `worker` service
3. ✅ Updated `app` service MongoDB URI to `host.docker.internal:27017`
4. ✅ Updated `worker` service MongoDB URI to `host.docker.internal:27017`
5. ✅ Removed MongoDB dependency from `app` and `worker` services
6. ✅ Removed `mongodb_data` volume

### .env Changes:
1. ✅ Added `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
2. ✅ Added `RABBITMQ_URL`
3. ✅ MongoDB URI already set to `localhost:27017`

---

## 🚀 How to Use

### Prerequisites:
1. **Install MongoDB locally** (not in Docker)
   - Download: https://www.mongodb.com/try/download/community
   - Install as Windows Service
   - Verify: Run `mongosh` in terminal

2. **Install Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop/
   - Start Docker Desktop

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

---

## 🎯 Quick Start Options

### Option 1: Infrastructure Only (Recommended for Development)
Start only Redis and RabbitMQ in Docker, run app locally:

```bash
# Using PowerShell script
.\setup-local.ps1
# Choose option 1

# Or manually
docker compose up -d redis rabbitmq

# Then run app locally
npm run dev

# Run worker locally (optional, in another terminal)
node src/workers/index.js
```

**Benefits:**
- Hot reload works
- Easy debugging
- Faster development

---

### Option 2: Everything in Docker
Run app, workers, Redis, and RabbitMQ in Docker:

```bash
# Using PowerShell script
.\setup-local.ps1
# Choose option 2

# Or manually
docker compose up -d --build
```

**Benefits:**
- Production-like environment
- No need to run npm commands
- Workers auto-scale (2 replicas)

---

## 📊 Service Architecture

```
┌─────────────────────────────────────────────────┐
│                  Your Computer                   │
│                                                  │
│  ┌──────────────┐                               │
│  │   MongoDB    │  Port 27017 (Local)           │
│  │   (Local)    │                               │
│  └──────────────┘                               │
│         ↑                                        │
│         │ host.docker.internal                  │
│         │                                        │
│  ┌──────────────────────────────────────────┐  │
│  │         Docker Containers                 │  │
│  │                                           │  │
│  │  ┌──────────┐  ┌──────────┐             │  │
│  │  │  Redis   │  │ RabbitMQ │             │  │
│  │  │  :6379   │  │  :5672   │             │  │
│  │  └──────────┘  └──────────┘             │  │
│  │       ↑              ↑                    │  │
│  │       │              │                    │  │
│  │  ┌────┴──────────────┴────┐             │  │
│  │  │        App              │             │  │
│  │  │      :8080              │             │  │
│  │  └─────────────────────────┘             │  │
│  │                                           │  │
│  │  ┌─────────────────────────┐             │  │
│  │  │   Worker (Replica 1)    │             │  │
│  │  └─────────────────────────┘             │  │
│  │  ┌─────────────────────────┐             │  │
│  │  │   Worker (Replica 2)    │             │  │
│  │  └─────────────────────────┘             │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Configuration Details

### Local Development (.env)
```env
MONGODB_URI="mongodb://localhost:27017/leetcode"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="redispass123"
RABBITMQ_URL="amqp://admin:rabbitmqpass123@localhost:5672"
```

### Docker Environment (docker-compose.yml)
```yaml
# App and Worker containers use:
MONGODB_URI: mongodb://host.docker.internal:27017/leetcode
REDIS_HOST: redis
REDIS_PORT: 6379
RABBITMQ_URL: amqp://admin:rabbitmqpass123@rabbitmq:5672
```

**Note:** `host.docker.internal` allows Docker containers to connect to services running on the host machine (your Windows PC).

---

## 🛠️ Common Commands

### Start Services
```bash
# Infrastructure only
docker compose up -d redis rabbitmq

# Everything
docker compose up -d

# With rebuild
docker compose up -d --build
```

### Stop Services
```bash
# Stop all
docker compose down

# Stop and remove volumes
docker compose down -v
```

### View Status
```bash
# Check running containers
docker compose ps

# View logs (all)
docker compose logs -f

# View logs (specific service)
docker compose logs -f app
docker compose logs -f worker
docker compose logs -f redis
docker compose logs -f rabbitmq
```

### Restart Services
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart app
docker compose restart worker
```

### Scale Workers
```bash
# Scale to 4 workers
docker compose up -d --scale worker=4

# Scale to 1 worker
docker compose up -d --scale worker=1
```

---

## 🌐 Access Points

### Application
- **API:** http://localhost:8080
- **Health Check:** http://localhost:8080/api/v1/health

### Services
- **MongoDB:** mongodb://localhost:27017/leetcode
- **MongoDB Compass:** Connect to `mongodb://localhost:27017`
- **RabbitMQ Management:** http://localhost:15672
  - Username: `admin`
  - Password: `rabbitmqpass123`
- **Redis:** localhost:6379
  - Password: `redispass123`

---

## 🐛 Troubleshooting

### Issue: Docker Compose Error
```
services.deploy.replicas: can't set container_name and worker
```
**Status:** ✅ FIXED - Removed container_name from worker service

### Issue: MongoDB Connection Failed
**Solution:**
1. Check MongoDB is running:
   ```bash
   mongosh
   ```
2. Start MongoDB service:
   - Open Windows Services
   - Find "MongoDB Server"
   - Click "Start"

### Issue: Redis Connection Failed
**Solution:**
```bash
# Check Redis status
docker compose ps redis

# Restart Redis
docker compose restart redis

# View Redis logs
docker compose logs redis
```

### Issue: RabbitMQ Connection Failed
**Solution:**
```bash
# Check RabbitMQ status
docker compose ps rabbitmq

# Restart RabbitMQ
docker compose restart rabbitmq

# View RabbitMQ logs
docker compose logs rabbitmq
```

### Issue: Worker Not Processing Jobs
**Solution:**
```bash
# Check worker logs
docker compose logs worker

# Check RabbitMQ queue
# Open http://localhost:15672
# Go to "Queues" tab
# Check "code_execution" queue

# Restart workers
docker compose restart worker
```

### Issue: Port Already in Use
**Solution:**
```bash
# Check what's using the port
netstat -ano | findstr :8080
netstat -ano | findstr :6379
netstat -ano | findstr :5672

# Kill the process or change port in docker-compose.yml
```

---

## 📚 Additional Resources

- **Full Docker Guide:** See `DOCKER_SETUP.md`
- **API Documentation:** See `API_DOCUMENTATION.md`
- **Postman Collection:** See `postman/Complete_API_Collection.postman_collection.json`
- **Testing Guide:** See `POSTMAN_TESTING_GUIDE.md`

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] MongoDB is running locally (`mongosh` works)
- [ ] Docker Desktop is running
- [ ] Redis container is running (`docker compose ps redis`)
- [ ] RabbitMQ container is running (`docker compose ps rabbitmq`)
- [ ] Can access RabbitMQ UI (http://localhost:15672)
- [ ] App starts successfully (`npm run dev` or Docker)
- [ ] Health check works (http://localhost:8080/api/v1/health)
- [ ] Can register/login user
- [ ] Can create/view problems
- [ ] Code execution works

---

## 🎉 Summary

**What's Fixed:**
1. ✅ Docker Compose error with worker replicas
2. ✅ MongoDB now runs locally (not in Docker)
3. ✅ All connection strings updated
4. ✅ Environment variables configured
5. ✅ Setup scripts created for easy management

**What You Get:**
- Clean Docker setup with only Redis and RabbitMQ
- Local MongoDB for better performance
- Worker scaling (2 replicas by default)
- Easy setup scripts (PowerShell and Batch)
- Comprehensive documentation

**Ready to Use!** 🚀
