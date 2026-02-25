# LeetCode Clone Backend

A coding platform backend with Node.js, Express, and MongoDB.

## What's Inside

- User authentication with JWT
- Problem management
- Code execution using Judge0 API
- Submission tracking
- Playlist system

## Requirements

- Docker
- Docker Compose

## Getting Started

Build and run everything:

```bash
docker-compose up -d --build
```

Check if it's running:

```bash
docker-compose ps
```

View logs:

```bash
docker-compose logs -f app
```

Test the API:

```bash
curl http://localhost:8080
```

## API Endpoints

**Auth**
- POST `/api/v1/auth/register` - Register
- POST `/api/v1/auth/login` - Login
- POST `/api/v1/auth/logout` - Logout

**Problems**
- GET `/api/v1/problems` - List problems
- GET `/api/v1/problems/:id` - Get problem
- POST `/api/v1/problems` - Create problem
- PUT `/api/v1/problems/:id` - Update problem
- DELETE `/api/v1/problems/:id` - Delete problem

**Code Execution**
- POST `/api/v1/execute-code` - Run code

**Submissions**
- GET `/api/v1/submission` - Get submissions
- GET `/api/v1/submission/:id` - Get submission

**Playlists**
- GET `/api/v1/playlist` - List playlists
- POST `/api/v1/playlist` - Create playlist
- GET `/api/v1/playlist/:id` - Get playlist
- PUT `/api/v1/playlist/:id` - Update playlist
- DELETE `/api/v1/playlist/:id` - Delete playlist

## Useful Commands

```bash
# Stop everything
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# View logs
docker-compose logs -f

# Restart app
docker-compose restart app

# Access MongoDB shell
docker exec -it leetcode-mongodb mongosh -u admin -p admin
```

## NPM Scripts

```bash
npm run docker:build    # Build images
npm run docker:up       # Start services
npm run docker:down     # Stop services
npm run docker:logs     # View logs
npm run docker:restart  # Restart app
```

## Local Development

If you want to run without Docker:

1. Start MongoDB:
```bash
docker-compose up -d db
```

2. Create `.env`:
```env
PORT=8080
MONGODB_URI=mongodb://admin:admin@localhost:27017/leetcode?authSource=admin
JWT_SECRET=your-secret-key
RAPIDAPI_KEY=your-rapidapi-key
RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
```

3. Run:
```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── controllers/    # Route handlers
├── models/        # Mongoose schemas
├── routes/        # API routes
├── middlewares/   # Auth, error handling
├── lib/          # Database, Judge0
└── index.js      # Entry point
```

## Troubleshooting

**Can't connect to MongoDB?**
```bash
docker-compose restart
```

**Port already in use?**
Edit `docker-compose.yml` and change the port:
```yaml
ports:
  - "3000:8080"
```

**Code changes not showing?**
```bash
docker-compose up -d --build
```
