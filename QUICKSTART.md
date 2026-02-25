# Quick Start

## Run the app

```bash
docker-compose up -d --build
```

## Check if it's working

```bash
curl http://localhost:8080
```

You should see:
```json
{
  "success": true,
  "message": "Welcome to leetcode api"
}
```

## View logs

```bash
docker-compose logs -f app
```

## Stop the app

```bash
docker-compose down
```

That's it!
