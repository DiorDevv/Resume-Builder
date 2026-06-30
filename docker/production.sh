#!/bin/bash
# Production deployment
# Usage: bash docker/production.sh

set -e

ENV_FILE="${1:-.env.prod}"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found!"
    echo "Usage: bash docker/production.sh [env-file]"
    echo ""
    echo "Required variables in $ENV_FILE:"
    echo "  SECRET_KEY=<random-secret>"
    echo "  DATABASE_URL=postgresql+asyncpg://..."
    echo "  REDIS_URL=redis://..."
    echo "  SMTP_HOST=smtp.example.com"
    echo "  SMTP_USER=user@example.com"
    echo "  SMTP_PASSWORD=..."
    echo "  FRONTEND_URL=https://..."
    echo "  COOKIE_SECURE=true"
    echo "  COOKIE_DOMAIN=.example.com"
    exit 1
fi

echo "=== Resume Builder Production Deployment ==="
echo "Using env file: $ENV_FILE"

# Build and start
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d --build

echo ""
echo "=== Services ==="
echo "Frontend: port 3000"
echo "Backend:  port 8000"
echo ""
echo "To stop: docker compose -f docker-compose.prod.yml down"
echo "To view logs: docker compose -f docker-compose.prod.yml logs -f"
