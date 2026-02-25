# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Prerequisites
```bash
# 1. Install MongoDB locally
# Download: https://www.mongodb.com/try/download/community
# Install and start MongoDB service

# 2. Install Docker Desktop
# Download: https://www.docker.com/products/docker-desktop/

# 3. Install Node.js dependencies
npm install
```

### Step 2: Start Services
```bash
# Option A: Development (Recommended)
docker compose up -d redis rabbitmq
npm run dev

# Option B: Production-like
docker compose up -d --build
```

### Step 3: Test
```bash
# Open browser
http://localhost:8080/api/v1/health

# Or use curl
curl http://localhost:8080/api/v1/health
```

---

## 📋 What's Running?

### Local Services:
- **MongoDB:** localhost:27017 (runs on your PC)

### Docker Services:
- **Redis:** localhost:6379
- **RabbitMQ:** localhost:5672
- **RabbitMQ UI:** http://localhost:15672 (admin/rabbitmqpass123)
- **App:** localhost:8080 (if using Docker)
- **Workers:** 2 replicas (if using Docker)

---

## 🎯 Common Tasks

### Start Infrastructure Only
```bash
docker compose up -d redis rabbitmq
npm run dev
```

### Start Everything
```bash
docker compose up -d --build
```

### Stop Everything
```bash
docker compose down
```

### View Logs
```bash
docker compose logs -f
```

### Check Status
```bash
docker compose ps
```

### Restart Services
```bash
docker compose restart
```

---

## 🔧 Quick Fixes

### MongoDB Not Running?
```bash
# Check MongoDB
mongosh

# If fails, start MongoDB service in Windows Services
```

### Docker Error?
```bash
# Restart Docker Desktop
# Then try again
docker compose up -d redis rabbitmq
```

### Port Already in Use?
```bash
# Check what's using port 8080
netstat -ano | findstr :8080

# Kill the process or change port
```

### Worker Not Processing?
```bash
# Check RabbitMQ UI
http://localhost:15672

# Restart workers
docker compose restart worker
```

---

## 📚 More Help

- **Full Setup Guide:** `SETUP_SUMMARY.md`
- **Docker Details:** `DOCKER_SETUP.md`
- **API Testing:** `POSTMAN_TESTING_GUIDE.md`
- **API Reference:** `API_DOCUMENTATION.md`

---

## ✅ Verification

After starting, verify:
- [ ] MongoDB: `mongosh` works
- [ ] Redis: `docker compose ps redis` shows "healthy"
- [ ] RabbitMQ: http://localhost:15672 opens
- [ ] API: http://localhost:8080/api/v1/health returns 200

---

## 🎉 You're Ready!

Import Postman collection and start testing:
```
postman/Complete_API_Collection.postman_collection.json
```

Happy coding! 🚀
