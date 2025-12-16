#!/bin/bash

# Docker setup script for P2P Gear Rental Platform
# This script helps set up the application using Docker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🐳 P2P Gear Rental - Docker Setup"
echo "=================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker prerequisites satisfied"

# Check if .env file exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "📝 Creating .env file from template..."
    if [ -f "$PROJECT_DIR/.env.example" ]; then
        cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        echo "✅ .env file created. Please edit it with your configuration."
        echo "   Important variables to set:"
        echo "   - POSTGRES_PASSWORD"
        echo "   - NEXT_PUBLIC_SUPABASE_URL"
        echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
        echo "   - STRIPE_SECRET_KEY"
        echo ""
        read -p "Press Enter to continue after editing .env file..."
    else
        echo "❌ .env.example not found. Please create a .env file manually."
        exit 1
    fi
fi

# Choose environment
echo "🌍 Choose deployment environment:"
echo "1) Development (with hot reload)"
echo "2) Production (optimized build)"
read -p "Enter choice (1-2): " env_choice

case $env_choice in
    1)
        echo "🔧 Setting up development environment..."
        COMPOSE_FILE="docker-compose.dev.yml"
        ;;
    2)
        echo "🚀 Setting up production environment..."
        COMPOSE_FILE="docker-compose.yml"
        ;;
    *)
        echo "❌ Invalid choice. Defaulting to development."
        COMPOSE_FILE="docker-compose.dev.yml"
        ;;
esac

# Build and start services
echo "🏗️  Building and starting services..."
cd "$PROJECT_DIR"

# Pull images
echo "📦 Pulling base images..."
docker compose -f "$COMPOSE_FILE" pull

# Build application (if production)
if [ "$COMPOSE_FILE" = "docker-compose.yml" ]; then
    echo "🔨 Building application image..."
    docker compose -f "$COMPOSE_FILE" build app
fi

# Start services
echo "🚀 Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check database connection
echo "🗄️  Checking database connection..."
if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready"
fi

# Run database migrations (if production)
if [ "$COMPOSE_FILE" = "docker-compose.yml" ]; then
    echo "🗄️  Running database migrations..."
    docker compose -f "$COMPOSE_FILE" exec app npm run migrate
fi

# Check Redis connection
echo "📦 Checking Redis connection..."
if docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
fi

# Show service status
echo ""
echo "📊 Service Status:"
echo "=================="
docker compose -f "$COMPOSE_FILE" ps

# Show useful URLs
echo ""
echo "🌐 Application URLs:"
echo "==================="
if [ "$COMPOSE_FILE" = "docker-compose.dev.yml" ]; then
    echo "Application: http://localhost:3000"
    echo "Database: localhost:5432"
    echo "Redis: localhost:6379"
else
    echo "Application: http://localhost (HTTP)"
    echo "Application: https://localhost (HTTPS)"
    echo "Health Check: http://localhost/api/health"
fi

# Show logs command
echo ""
echo "📝 Useful commands:"
echo "==================="
echo "View logs: docker compose -f $COMPOSE_FILE logs -f"
echo "Stop services: docker compose -f $COMPOSE_FILE down"
echo "Restart app: docker compose -f $COMPOSE_FILE restart app"
echo "Database shell: docker compose -f $COMPOSE_FILE exec db psql -U postgres -d gearshare"
echo "Redis shell: docker compose -f $COMPOSE_FILE exec redis redis-cli"

echo ""
echo "🎉 Setup complete! Your application should be running."
echo "   Check the URLs above to access your application."