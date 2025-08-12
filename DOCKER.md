# Docker Deployment Guide

This guide covers deploying the P2P Gear Rental Platform using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available for containers
- 10GB disk space for images and data

## Quick Start

### 1. Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Required environment variables:**
- `POSTGRES_PASSWORD` - Database password
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `STRIPE_SECRET_KEY` - Stripe secret key

### 2. Development Setup

```bash
# Automated setup (recommended)
npm run docker:setup

# Or manual setup
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### 3. Production Setup

```bash
# Build production image
npm run docker:build

# Start production services
npm run docker:prod

# View status
docker-compose ps
```

## Services Overview

### Core Services

| Service | Port | Description |
|---------|------|-------------|
| **app** | 3000 | Next.js application |
| **db** | 5432 | PostgreSQL database |
| **redis** | 6379 | Redis cache |

### Optional Services

| Service | Port | Description | Profile |
|---------|------|-------------|---------|
| **nginx** | 80, 443 | Reverse proxy | `production` |
| **db_backup** | - | Automated backups | `backup` |
| **mailhog** | 8025 | Email testing | `mail` |

## Service Profiles

Enable optional services using profiles:

```bash
# Start with nginx reverse proxy
docker-compose --profile production up -d

# Start with backup service
docker-compose --profile backup up -d

# Start development with email testing
docker-compose -f docker-compose.dev.yml --profile mail up -d
```

## Database Management

### Migrations

```bash
# Run migrations (production)
docker-compose exec app npm run migrate

# Reset database (development)
docker-compose -f docker-compose.dev.yml exec app npm run prisma:reset
```

### Backups

```bash
# Create backup
npm run docker:backup

# List backups
./scripts/backup-restore.sh list

# Restore backup
npm run docker:restore backup_gearshare_20231201_120000.sql.gz

# Cleanup old backups
npm run docker:cleanup --days 7
```

### Direct Database Access

```bash
# PostgreSQL shell
docker-compose exec db psql -U postgres -d gearshare

# Redis CLI
docker-compose exec redis redis-cli

# View database logs
docker-compose logs db
```

## Monitoring & Debugging

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/health

# Container health status
docker-compose ps

# Detailed container info
docker inspect p2p-gear-rental_app_1
```

### Logs

```bash
# View all logs
npm run docker:logs

# View specific service logs
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f redis

# Tail logs with timestamps
docker-compose logs -f --timestamps app
```

### Performance Monitoring

```bash
# Container resource usage
docker stats

# Disk usage
docker system df

# Network information
docker network ls
docker network inspect p2p-gear-rental_app_network
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Application environment |
| `PORT` | `3000` | Application port |
| `DATABASE_URL` | Auto-generated | PostgreSQL connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `LOG_LEVEL` | `INFO` | Application log level |
| `METRICS_API_TOKEN` | `monitoring-secret-token` | Metrics API authentication |

### Resource Limits

Services have resource limits configured:

```yaml
# Application
memory: 1G
cpus: '0.5'

# Database  
memory: 512M
cpus: '0.5'

# Redis
memory: 256M
cpus: '0.25'
```

### Volume Mounts

| Volume | Purpose | Backup Required |
|--------|---------|-----------------|
| `postgres_data` | Database storage | ✅ Yes |
| `redis_data` | Cache storage | ❌ No |
| `app_uploads` | File uploads | ✅ Yes |
| `backup_data` | Database backups | ✅ Yes |

## SSL/TLS Configuration

For production HTTPS:

1. Place SSL certificates in `./docker/nginx/ssl/`:
   ```
   docker/nginx/ssl/
   ├── cert.pem
   └── key.pem
   ```

2. Start with production profile:
   ```bash
   docker-compose --profile production up -d
   ```

## Scaling & Load Balancing

### Horizontal Scaling

```bash
# Scale application instances
docker-compose up -d --scale app=3

# Use nginx for load balancing
docker-compose --profile production up -d --scale app=3
```

### Database Connection Pooling

The application uses Prisma's built-in connection pooling. Configure in `.env`:

```env
DATABASE_URL="postgresql://user:pass@db:5432/gearshare?connection_limit=20&pool_timeout=20"
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Use different ports
PORT=3001 docker-compose up -d
```

#### 2. Database Connection Issues
```bash
# Check database status
docker-compose exec db pg_isready

# Reset database password
docker-compose exec db psql -U postgres -c "ALTER USER postgres PASSWORD 'newpassword';"
```

#### 3. Redis Connection Issues
```bash
# Test Redis connection
docker-compose exec redis redis-cli ping

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

#### 4. Application Won't Start
```bash
# Check application logs
docker-compose logs app

# Restart application
docker-compose restart app

# Rebuild application
docker-compose build --no-cache app
```

### Recovery Procedures

#### Complete System Recovery

1. Stop all services:
   ```bash
   docker-compose down
   ```

2. Remove volumes (⚠️ **This will delete all data**):
   ```bash
   docker-compose down -v
   ```

3. Clean Docker system:
   ```bash
   docker system prune -a
   ```

4. Rebuild and restart:
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

#### Partial Recovery

```bash
# Restart specific service
docker-compose restart app

# Recreate service with new image
docker-compose up -d --force-recreate app

# Update service
docker-compose pull app
docker-compose up -d app
```

## Security Considerations

1. **Environment Variables**: Store secrets in `.env` file, never in compose files
2. **Network Isolation**: Services communicate through internal networks
3. **Non-root Users**: Application runs as non-root user `nextjs`
4. **Health Checks**: Regular health monitoring prevents unhealthy containers
5. **Resource Limits**: Prevents resource exhaustion attacks
6. **SSL/TLS**: Use HTTPS in production with proper certificates

## Maintenance

### Regular Tasks

```bash
# Update images
docker-compose pull
docker-compose up -d

# Clean up unused resources
docker system prune

# Backup database
npm run docker:backup

# Update application
git pull
docker-compose build app
docker-compose up -d app
```

### Monitoring

Set up monitoring for:
- Container health status
- Resource usage (CPU, memory, disk)
- Application logs
- Database performance
- Backup success/failure

## Support

For issues:
1. Check logs: `docker-compose logs [service]`
2. Verify configuration: `docker-compose config`
3. Check health: `curl http://localhost:3000/api/health`
4. Review this guide for common solutions