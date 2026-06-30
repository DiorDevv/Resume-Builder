#!/bin/bash
# Development environment setup
# Usage: bash docker/development.sh

set -e

echo "=== Resume Builder Development Setup ==="

# Copy env files if not exist
if [ ! -f backend/.env ]; then
    cp .env.example backend/.env
    echo "Created backend/.env from .env.example"
fi

if [ ! -f frontend/.env.local ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
    echo "Created frontend/.env.local"
fi

# Start services
echo "Starting PostgreSQL, Redis, Backend, Frontend..."
docker compose up -d --build

echo ""
echo "=== Services ==="
echo "Frontend:  http://localhost:3000"
echo "Backend:   http://localhost:8000"
echo "API Docs:  http://localhost:8000/docs"
echo "PostgreSQL: localhost:5432"
echo "Redis:     localhost:6379"
echo ""
echo "To stop: docker compose down"
echo "To view logs: docker compose logs -f"
