# Docker Setup

## Quick Start

Run this to get everything up:

```bash
docker-compose up -d --build
```

Check if it's working:

```bash
docker-compose ps
```

See the logs:

```bash
docker-compose logs -f app
```

Test it:

```bash
curl http://localhost:8080
```

## What Changed

The app now connects to MongoDB using `db:27017` instead of `localhost:27017` because they're in the same Docker network.

Both containers talk to each other through the `leetcode-network`, but you can still access them from your machine at `localhost:8080` and `localhost:27017`.

## Common Commands

```bash
# See logs
docker-compose logs -f app
docker-compose logs -f db

# Restart
docker-compose restart app

# Stop (keeps data)
docker-compose down

# Stop and delete data
docker-compose down -v

# Rebuild
docker-compose up -d --build

# MongoDB shell
docker exec -it leetcode-mongodb mongosh -u admin -p admin

# Get into app container
docker exec -it leetcode-app sh
```

## NPM Shortcuts

```bash
npm run docker:build
npm run docker:up
npm run docker:down
npm run docker:logs
npm run docker:restart
```

## Troubleshooting

**Can't connect to MongoDB?**

Check the status:
```bash
docker-compose ps
```

See what's wrong:
```bash
docker-compose logs db
```

Restart:
```bash
docker-compose restart
```

**Port already taken?**

Change it in `docker-compose.yml`:
```yaml
ports:
  - "3000:8080"
```

**Changes not showing up?**

Rebuild:
```bash
docker-compose up -d --build
```

## Environment Variables

All env vars are in `docker-compose.yml`. Change them there and rebuild.

## Data Backup

Backup:
```bash
docker exec leetcode-mongodb mongodump -u admin -p admin --authenticationDatabase admin -o /backup
docker cp leetcode-mongodb:/backup ./mongodb-backup
```

Restore:
```bash
docker cp ./mongodb-backup leetcode-mongodb:/backup
docker exec leetcode-mongodb mongorestore -u admin -p admin --authenticationDatabase admin /backup
```
