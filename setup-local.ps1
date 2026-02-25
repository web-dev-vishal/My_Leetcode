# Local Development Setup Script for Windows
# This script helps set up the development environment

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "LeetCode Clone - Local Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
    if ($mongoProcess) {
        Write-Host "✓ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "✗ MongoDB is not running" -ForegroundColor Red
        Write-Host "  Please start MongoDB service or run 'mongod' command" -ForegroundColor Yellow
        Write-Host "  You can start it from Windows Services or MongoDB Compass" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ MongoDB check failed" -ForegroundColor Red
}

Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if .env file exists
Write-Host "Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    Write-Host "  Please create .env file from .env.example" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Ask user what to start
Write-Host "What would you like to do?" -ForegroundColor Cyan
Write-Host "1. Start infrastructure only (Redis + RabbitMQ)" -ForegroundColor White
Write-Host "2. Start everything in Docker (App + Workers + Infrastructure)" -ForegroundColor White
Write-Host "3. Stop all Docker services" -ForegroundColor White
Write-Host "4. View service status" -ForegroundColor White
Write-Host "5. View logs" -ForegroundColor White
Write-Host "6. Clean up (remove containers and volumes)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting Redis and RabbitMQ..." -ForegroundColor Yellow
        docker compose up -d redis rabbitmq
        Write-Host ""
        Write-Host "✓ Infrastructure services started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Run 'npm run dev' to start the app locally" -ForegroundColor White
        Write-Host "2. Run 'node src/workers/index.js' to start worker locally (optional)" -ForegroundColor White
        Write-Host ""
        Write-Host "Access points:" -ForegroundColor Cyan
        Write-Host "- RabbitMQ Management: http://localhost:15672 (admin/rabbitmqpass123)" -ForegroundColor White
        Write-Host "- MongoDB: mongodb://localhost:27017/leetcode" -ForegroundColor White
    }
    "2" {
        Write-Host ""
        Write-Host "Building and starting all services..." -ForegroundColor Yellow
        docker compose up -d --build
        Write-Host ""
        Write-Host "✓ All services started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access points:" -ForegroundColor Cyan
        Write-Host "- API: http://localhost:8080" -ForegroundColor White
        Write-Host "- Health Check: http://localhost:8080/api/v1/health" -ForegroundColor White
        Write-Host "- RabbitMQ Management: http://localhost:15672 (admin/rabbitmqpass123)" -ForegroundColor White
        Write-Host "- MongoDB: mongodb://localhost:27017/leetcode" -ForegroundColor White
        Write-Host ""
        Write-Host "View logs with: docker compose logs -f" -ForegroundColor Yellow
    }
    "3" {
        Write-Host ""
        Write-Host "Stopping all services..." -ForegroundColor Yellow
        docker compose down
        Write-Host ""
        Write-Host "✓ All services stopped!" -ForegroundColor Green
    }
    "4" {
        Write-Host ""
        Write-Host "Service Status:" -ForegroundColor Cyan
        docker compose ps
        Write-Host ""
        Write-Host "MongoDB Status:" -ForegroundColor Cyan
        $mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
        if ($mongoProcess) {
            Write-Host "✓ MongoDB is running (PID: $($mongoProcess.Id))" -ForegroundColor Green
        } else {
            Write-Host "✗ MongoDB is not running" -ForegroundColor Red
        }
    }
    "5" {
        Write-Host ""
        Write-Host "Which service logs?" -ForegroundColor Cyan
        Write-Host "1. All services" -ForegroundColor White
        Write-Host "2. App only" -ForegroundColor White
        Write-Host "3. Worker only" -ForegroundColor White
        Write-Host "4. Redis only" -ForegroundColor White
        Write-Host "5. RabbitMQ only" -ForegroundColor White
        Write-Host ""
        $logChoice = Read-Host "Enter your choice (1-5)"
        Write-Host ""
        switch ($logChoice) {
            "1" { docker compose logs -f }
            "2" { docker compose logs -f app }
            "3" { docker compose logs -f worker }
            "4" { docker compose logs -f redis }
            "5" { docker compose logs -f rabbitmq }
            default { Write-Host "Invalid choice" -ForegroundColor Red }
        }
    }
    "6" {
        Write-Host ""
        Write-Host "WARNING: This will remove all containers and volumes!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? (yes/no)"
        if ($confirm -eq "yes") {
            Write-Host ""
            Write-Host "Cleaning up..." -ForegroundColor Yellow
            docker compose down -v
            Write-Host ""
            Write-Host "✓ Cleanup complete!" -ForegroundColor Green
        } else {
            Write-Host "Cancelled" -ForegroundColor Yellow
        }
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
