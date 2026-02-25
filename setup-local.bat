@echo off
REM Local Development Setup Script for Windows

echo ==================================
echo LeetCode Clone - Local Setup
echo ==================================
echo.

echo What would you like to do?
echo 1. Start infrastructure only (Redis + RabbitMQ)
echo 2. Start everything in Docker (App + Workers + Infrastructure)
echo 3. Stop all Docker services
echo 4. View service status
echo 5. Clean up (remove containers and volumes)
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto infrastructure
if "%choice%"=="2" goto all
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto status
if "%choice%"=="5" goto clean
goto invalid

:infrastructure
echo.
echo Starting Redis and RabbitMQ...
docker compose up -d redis rabbitmq
echo.
echo Infrastructure services started!
echo.
echo Next steps:
echo 1. Run 'npm run dev' to start the app locally
echo 2. Run 'node src/workers/index.js' to start worker locally (optional)
echo.
echo Access points:
echo - RabbitMQ Management: http://localhost:15672 (admin/rabbitmqpass123)
echo - MongoDB: mongodb://localhost:27017/leetcode
goto end

:all
echo.
echo Building and starting all services...
docker compose up -d --build
echo.
echo All services started!
echo.
echo Access points:
echo - API: http://localhost:8080
echo - Health Check: http://localhost:8080/api/v1/health
echo - RabbitMQ Management: http://localhost:15672 (admin/rabbitmqpass123)
echo - MongoDB: mongodb://localhost:27017/leetcode
echo.
echo View logs with: docker compose logs -f
goto end

:stop
echo.
echo Stopping all services...
docker compose down
echo.
echo All services stopped!
goto end

:status
echo.
echo Service Status:
docker compose ps
goto end

:clean
echo.
echo WARNING: This will remove all containers and volumes!
set /p confirm="Are you sure? (yes/no): "
if "%confirm%"=="yes" (
    echo.
    echo Cleaning up...
    docker compose down -v
    echo.
    echo Cleanup complete!
) else (
    echo Cancelled
)
goto end

:invalid
echo Invalid choice
goto end

:end
echo.
pause
