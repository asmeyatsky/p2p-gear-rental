# P2P Gear Rental Platform - Google Cloud Deployment Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Google Cloud Services Required](#google-cloud-services-required)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Security Configuration](#security-configuration)
10. [Cost Estimation](#cost-estimation)
11. [Maintenance and Scaling](#maintenance-and-scaling)
12. [Troubleshooting](#troubleshooting)

## Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Google Cloud Platform                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Cloud Run     │  │  Cloud SQL      │  │  Cloud Storage  │ │
│  │   (Next.js App) │  │  (PostgreSQL)   │  │  (File Storage) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│            │                    │                    │          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Cloud Build    │  │  Memorystore    │  │  Cloud CDN      │ │
│  │  (CI/CD)        │  │  (Redis)        │  │  (Static Assets)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│            │                    │                    │          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Secret Manager │  │  Cloud Monitor  │  │  Cloud Logging  │ │
│  │  (API Keys)     │  │  (Metrics)      │  │  (Logs)         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 15 with React 19
- **Backend**: Next.js API Routes
- **Database**: Cloud SQL (PostgreSQL) with Prisma ORM
- **Caching**: Memorystore (Redis)
- **Authentication**: Supabase
- **Payments**: Stripe
- **File Storage**: Cloud Storage
- **Container Runtime**: Cloud Run
- **CI/CD**: Cloud Build
- **Monitoring**: Cloud Monitoring & Logging

## Prerequisites

### Required Accounts
1. **Google Cloud Platform Account**
   - Enable billing
   - Create new project or use existing

2. **External Services**
   - Supabase account (authentication)
   - Stripe account (payments)
   - Domain name (optional but recommended)

### Local Development Tools
```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Install Docker
# Download from https://docker.com/products/docker-desktop

# Install Node.js 18+
# Download from https://nodejs.org

# Install Git
# Already available on most systems
```

## Google Cloud Services Required

### Core Services

#### 1. Cloud Run
**Purpose**: Container hosting for the Next.js application
- **Configuration**: 
  - CPU: 2 vCPU
  - Memory: 4 GiB
  - Min instances: 1
  - Max instances: 100
  - Request timeout: 300s

#### 2. Cloud SQL
**Purpose**: Managed PostgreSQL database
- **Configuration**:
  - Instance type: db-custom-2-4096 (2 vCPU, 4 GB RAM)
  - Storage: 100 GB SSD (auto-expand enabled)
  - High availability: Enabled for production
  - Automated backups: Daily at 3 AM

#### 3. Memorystore for Redis
**Purpose**: Caching layer for improved performance
- **Configuration**:
  - Tier: Standard (for HA)
  - Memory size: 1 GB
  - Region: Same as Cloud Run

#### 4. Cloud Storage
**Purpose**: File storage for user uploads
- **Buckets**:
  - `{project-id}-gear-images`: Gear photos
  - `{project-id}-user-avatars`: User profile pictures
  - `{project-id}-static-assets`: Application assets

#### 5. Cloud Build
**Purpose**: CI/CD pipeline
- **Triggers**: GitHub integration
- **Build configuration**: cloudbuild.yaml

### Security & Monitoring Services

#### 6. Secret Manager
**Purpose**: Secure storage of API keys and sensitive data
- Stripe API keys
- Supabase credentials
- Database passwords
- JWT secrets

#### 7. Cloud Monitoring
**Purpose**: Application performance monitoring
- Custom metrics
- Alerting policies
- Uptime checks

#### 8. Cloud Logging
**Purpose**: Centralized logging
- Application logs
- Access logs
- Error tracking

#### 9. Cloud CDN
**Purpose**: Global content delivery
- Static asset caching
- Image optimization

## Step-by-Step Deployment

### Phase 1: Project Setup

#### 1. Create Google Cloud Project
```bash
# Set project variables
export PROJECT_ID="p2p-gear-rental-prod"
export REGION="us-central1"
export ZONE="us-central1-a"

# Create project
gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID

# Link billing account (replace with your billing account ID)
gcloud billing projects link $PROJECT_ID --billing-account=XXXXXX-XXXXXX-XXXXXX
```

#### 2. Enable Required APIs
```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  cdn.googleapis.com \
  compute.googleapis.com
```

### Phase 2: Database Setup

#### 1. Create Cloud SQL Instance
```bash
# Create PostgreSQL instance
gcloud sql instances create gear-rental-db \
  --database-version=POSTGRES_15 \
  --cpu=2 \
  --memory=4GB \
  --storage-size=100GB \
  --storage-type=SSD \
  --storage-auto-increase \
  --region=$REGION \
  --enable-bin-log \
  --backup-start-time=03:00

# Create database
gcloud sql databases create gearrental --instance=gear-rental-db

# Create database user
gcloud sql users create appuser \
  --instance=gear-rental-db \
  --password=$(openssl rand -base64 32)

# Get connection name for later use
gcloud sql instances describe gear-rental-db --format="value(connectionName)"
```

#### 2. Create Redis Instance
```bash
# Create Redis instance
gcloud redis instances create gear-rental-cache \
  --size=1 \
  --region=$REGION \
  --redis-version=redis_7_0 \
  --tier=standard
```

### Phase 3: Storage Setup

#### 1. Create Cloud Storage Buckets
```bash
# Create buckets
gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://$PROJECT_ID-gear-images
gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://$PROJECT_ID-user-avatars
gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://$PROJECT_ID-static-assets

# Set bucket permissions
gsutil iam ch allUsers:objectViewer gs://$PROJECT_ID-gear-images
gsutil iam ch allUsers:objectViewer gs://$PROJECT_ID-user-avatars
gsutil iam ch allUsers:objectViewer gs://$PROJECT_ID-static-assets

# Enable CORS for image uploads
cat > cors.json << EOF
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET", "PUT", "POST"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://$PROJECT_ID-gear-images
gsutil cors set cors.json gs://$PROJECT_ID-user-avatars
```

### Phase 4: Secrets Management

#### 1. Store Secrets in Secret Manager
```bash
# Database URL
echo "postgresql://appuser:YOUR_PASSWORD@/gearrental?host=/cloudsql/CONNECTION_NAME" | \
  gcloud secrets create database-url --data-file=-

# Supabase credentials
echo "https://gietfsryjwphwxfvwbnd.supabase.co" | \
  gcloud secrets create supabase-url --data-file=-

echo "sb_publishable_f83Nr0PARh5fRJ8DeO_S90_UldsvZDy" | \
  gcloud secrets create supabase-anon-key --data-file=-

# Stripe keys (replace with your actual keys)
echo "sk_live_YOUR_STRIPE_SECRET_KEY" | \
  gcloud secrets create stripe-secret-key --data-file=-

echo "pk_live_YOUR_STRIPE_PUBLISHABLE_KEY" | \
  gcloud secrets create stripe-publishable-key --data-file=-

echo "whsec_YOUR_WEBHOOK_SECRET" | \
  gcloud secrets create stripe-webhook-secret --data-file=-

# Redis URL (get from Redis instance details)
REDIS_IP=$(gcloud redis instances describe gear-rental-cache --region=$REGION --format="value(host)")
echo "redis://$REDIS_IP:6379" | \
  gcloud secrets create redis-url --data-file=-

# Generate JWT secret
openssl rand -base64 64 | gcloud secrets create jwt-secret --data-file=-
```

### Phase 5: Build Configuration

#### 1. Create Cloud Build Configuration
```bash
# Create cloudbuild.yaml in project root
cat > cloudbuild.yaml << 'EOF'
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/gear-rental:$COMMIT_SHA', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/gear-rental:$COMMIT_SHA']
  
  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'gear-rental-service'
      - '--image'
      - 'gcr.io/$PROJECT_ID/gear-rental:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--set-env-vars'
      - 'NODE_ENV=production'
      - '--set-secrets'
      - 'DATABASE_URL=database-url:latest,NEXT_PUBLIC_SUPABASE_URL=supabase-url:latest,NEXT_PUBLIC_SUPABASE_ANON_KEY=supabase-anon-key:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=stripe-publishable-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest,REDIS_URL=redis-url:latest,JWT_SECRET=jwt-secret:latest'
      - '--add-cloudsql-instances'
      - '${_CLOUD_SQL_CONNECTION_NAME}'
      - '--cpu'
      - '2'
      - '--memory'
      - '4Gi'
      - '--min-instances'
      - '1'
      - '--max-instances'
      - '100'
      - '--timeout'
      - '300'

substitutions:
  _CLOUD_SQL_CONNECTION_NAME: 'PROJECT_ID:REGION:INSTANCE_NAME'

options:
  logging: CLOUD_LOGGING_ONLY
EOF
```

#### 2. Create Dockerfile for Production
```bash
cat > Dockerfile.prod << 'EOF'
# Multi-stage build for production
FROM node:18-alpine AS dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Install Cloud SQL Proxy
RUN wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
RUN chmod +x cloud_sql_proxy

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["npm", "start"]
EOF
```

### Phase 6: Application Deployment

#### 1. Initial Manual Deployment
```bash
# Build and push initial image
docker build -f Dockerfile.prod -t gcr.io/$PROJECT_ID/gear-rental:latest .
docker push gcr.io/$PROJECT_ID/gear-rental:latest

# Deploy to Cloud Run
gcloud run deploy gear-rental-service \
  --image gcr.io/$PROJECT_ID/gear-rental:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=database-url:latest,NEXT_PUBLIC_SUPABASE_URL=supabase-url:latest,NEXT_PUBLIC_SUPABASE_ANON_KEY=supabase-anon-key:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=stripe-publishable-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest,REDIS_URL=redis-url:latest,JWT_SECRET=jwt-secret:latest \
  --add-cloudsql-instances $PROJECT_ID:$REGION:gear-rental-db \
  --cpu 2 \
  --memory 4Gi \
  --min-instances 1 \
  --max-instances 100 \
  --timeout 300
```

#### 2. Run Database Migrations
```bash
# Connect to Cloud SQL and run migrations
gcloud sql connect gear-rental-db --user=appuser

# In the SQL prompt, or use Cloud Shell with psql
# First, install psql in Cloud Shell if needed
sudo apt-get update && sudo apt-get install postgresql-client

# Connect and run migrations
PGPASSWORD=YOUR_PASSWORD psql -h 127.0.0.1 -U appuser -d gearrental

# Exit psql and run Prisma migrations via Cloud Shell
# Clone your repo in Cloud Shell and run:
npm install
npx prisma migrate deploy
npx prisma db seed
```

### Phase 7: Domain and CDN Setup

#### 1. Custom Domain Configuration
```bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create \
  --service gear-rental-service \
  --domain your-domain.com \
  --region $REGION

# Get the DNS records to configure
gcloud run domain-mappings describe \
  --domain your-domain.com \
  --region $REGION
```

#### 2. Setup Cloud CDN
```bash
# Create backend bucket for static assets
gsutil mb gs://$PROJECT_ID-cdn-backend

# Create load balancer and CDN
gcloud compute backend-buckets create gear-rental-static-backend \
  --gcs-bucket-name=$PROJECT_ID-static-assets

gcloud compute url-maps create gear-rental-lb \
  --default-backend-bucket=gear-rental-static-backend

gcloud compute target-https-proxies create gear-rental-https-proxy \
  --url-map=gear-rental-lb \
  --ssl-certificates=gear-rental-ssl-cert

gcloud compute forwarding-rules create gear-rental-https-forwarding-rule \
  --global \
  --target-https-proxy=gear-rental-https-proxy \
  --ports=443
```

## Environment Configuration

### Production Environment Variables
```bash
# Application Configuration
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1

# Database Configuration
DATABASE_URL=postgresql://appuser:password@/gearrental?host=/cloudsql/connection-name

# Authentication (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://gietfsryjwphwxfvwbnd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_f83Nr0PARh5fRJ8DeO_S90_UldsvZDy

# Payment Processing (Stripe)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Caching
REDIS_URL=redis://redis-ip:6379

# Security
JWT_SECRET=your_jwt_secret_64_chars
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.com

# File Storage
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=your-project-id-gear-images

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn
GOOGLE_ANALYTICS_ID=your_ga_id
```

## CI/CD Pipeline

### GitHub Actions Integration
```yaml
# .github/workflows/deploy.yml
name: Deploy to Google Cloud Run

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  PROJECT_ID: p2p-gear-rental-prod
  SERVICE_NAME: gear-rental-service
  REGION: us-central1

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: |
          npm run test
          npm run lint
          npm run type-check
      
      - name: Run E2E tests
        run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Google Cloud CLI
        uses: google-github-actions/setup-gcloud@v0
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ env.PROJECT_ID }}
      
      - name: Configure Docker for GCR
        run: gcloud auth configure-docker
      
      - name: Build and Deploy
        run: |
          gcloud builds submit --config cloudbuild.yaml .
```

## Monitoring and Logging

### 1. Application Monitoring
```bash
# Create custom metrics
gcloud logging metrics create gear_rental_errors \
  --description="Count of application errors" \
  --log-filter='resource.type="cloud_run_revision" AND severity>=ERROR'

gcloud logging metrics create gear_rental_requests \
  --description="Count of HTTP requests" \
  --log-filter='resource.type="cloud_run_revision" AND httpRequest.requestMethod!=""'
```

### 2. Alerting Policies
```bash
# Create alerting policy for high error rate
cat > error-alert-policy.json << EOF
{
  "displayName": "High Error Rate Alert",
  "conditions": [
    {
      "displayName": "Error rate condition",
      "conditionThreshold": {
        "filter": "metric.type=\"logging.googleapis.com/user/gear_rental_errors\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 10,
        "duration": "300s"
      }
    }
  ],
  "notificationChannels": [],
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
EOF

gcloud alpha monitoring policies create --policy-from-file=error-alert-policy.json
```

### 3. Uptime Monitoring
```bash
# Create uptime check
gcloud monitoring uptime create gear-rental-uptime-check \
  --hostname=your-domain.com \
  --path=/ \
  --port=443 \
  --protocol=HTTPS \
  --check-interval=60s \
  --timeout=10s
```

## Security Configuration

### 1. IAM Roles and Permissions
```bash
# Create service account for the application
gcloud iam service-accounts create gear-rental-app \
  --description="Service account for Gear Rental application" \
  --display-name="Gear Rental App"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:gear-rental-app@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:gear-rental-app@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:gear-rental-app@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 2. Network Security
```bash
# Create VPC network (optional for enhanced security)
gcloud compute networks create gear-rental-vpc \
  --subnet-mode=custom

gcloud compute networks subnets create gear-rental-subnet \
  --network=gear-rental-vpc \
  --range=10.0.0.0/24 \
  --region=$REGION

# Configure firewall rules
gcloud compute firewall-rules create allow-gear-rental-ingress \
  --network=gear-rental-vpc \
  --action=allow \
  --rules=tcp:3000 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=gear-rental-app
```

### 3. SSL/TLS Configuration
```bash
# Create managed SSL certificate
gcloud compute ssl-certificates create gear-rental-ssl-cert \
  --domains=your-domain.com,www.your-domain.com \
  --global
```

## Cost Estimation

### Monthly Cost Breakdown (USD)

#### Small Scale (< 1000 users)
- **Cloud Run**: $20-50
  - 1-2 instances running
  - 1M requests/month
- **Cloud SQL**: $50-80
  - db-custom-1-3840 instance
  - 10GB storage
- **Memorystore Redis**: $50
  - 1GB Basic tier
- **Cloud Storage**: $5-10
  - 100GB storage
  - Minimal egress
- **Other Services**: $10-20
  - Monitoring, logging, etc.
- **Total**: ~$135-210/month

#### Medium Scale (1K-10K users)
- **Cloud Run**: $100-200
  - 3-5 instances
  - 5M requests/month
- **Cloud SQL**: $150-250
  - db-custom-2-4096 instance
  - 100GB storage
- **Memorystore Redis**: $100
  - 1GB Standard tier (HA)
- **Cloud Storage**: $25-50
  - 500GB storage
  - Moderate egress
- **Cloud CDN**: $20-40
  - 1TB cache fills
- **Other Services**: $30-50
- **Total**: ~$425-690/month

#### Large Scale (10K+ users)
- **Cloud Run**: $500-1000
  - 10-20 instances
  - 20M+ requests/month
- **Cloud SQL**: $500-1000
  - db-custom-4-8192 instance
  - 500GB+ storage
- **Memorystore Redis**: $200-400
  - 4GB+ Standard tier
- **Cloud Storage**: $100-200
  - 2TB+ storage
  - High egress
- **Cloud CDN**: $100-200
  - 5TB+ cache fills
- **Load Balancer**: $20-30
- **Other Services**: $100-200
- **Total**: ~$1,420-2,830/month

### Cost Optimization Tips
1. **Use Committed Use Discounts** for Cloud SQL (up to 57% savings)
2. **Enable Cloud Run CPU allocation** only during requests
3. **Implement efficient caching** to reduce database load
4. **Use Cloud Storage lifecycle policies** for old files
5. **Monitor and alert on costs** to prevent surprises

## Maintenance and Scaling

### Automated Scaling Configuration
```bash
# Update Cloud Run service with scaling parameters
gcloud run services update gear-rental-service \
  --region=$REGION \
  --cpu-throttling \
  --concurrency=80 \
  --min-instances=2 \
  --max-instances=100 \
  --memory=4Gi \
  --cpu=2
```

### Database Scaling
```bash
# Scale up Cloud SQL instance
gcloud sql instances patch gear-rental-db \
  --cpu=4 \
  --memory=8GB

# Create read replicas for read-heavy workloads
gcloud sql instances create gear-rental-db-read-replica \
  --master-instance-name=gear-rental-db \
  --region=$REGION
```

### Backup and Disaster Recovery
```bash
# Enable automated backups (already configured)
gcloud sql instances patch gear-rental-db \
  --backup-start-time=03:00 \
  --retained-backups-count=30

# Create on-demand backup
gcloud sql backups create \
  --instance=gear-rental-db \
  --description="Pre-deployment backup"

# Export database for additional backup
gcloud sql export sql gear-rental-db gs://$PROJECT_ID-backups/db-backup-$(date +%Y%m%d).sql \
  --database=gearrental
```

### Monitoring and Maintenance Tasks

#### Weekly Tasks
1. Review error logs and performance metrics
2. Check security alerts and update dependencies
3. Monitor cost and usage patterns
4. Review and rotate secrets if needed

#### Monthly Tasks
1. Review and optimize database performance
2. Update application dependencies
3. Review and update scaling parameters
4. Conduct security audit
5. Review backup and disaster recovery procedures

#### Quarterly Tasks
1. Review architecture and scaling needs
2. Update security policies and access controls
3. Review cost optimization opportunities
4. Plan for major updates and new features

## Troubleshooting

### Common Issues and Solutions

#### 1. Cloud Run Deployment Failures
```bash
# Check build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID

# Check Cloud Run logs
gcloud run services logs tail gear-rental-service --region=$REGION

# Debug service configuration
gcloud run services describe gear-rental-service --region=$REGION
```

#### 2. Database Connection Issues
```bash
# Test Cloud SQL connectivity
gcloud sql connect gear-rental-db --user=appuser

# Check Cloud SQL Auth proxy logs
gcloud logging read 'resource.type="cloud_sql_database"' --limit=50

# Verify IAM permissions
gcloud projects get-iam-policy $PROJECT_ID
```

#### 3. Performance Issues
```bash
# Monitor resource usage
gcloud monitoring dashboards list
gcloud monitoring metrics list --filter="resource.type=cloud_run_revision"

# Check Redis connectivity and usage
gcloud redis instances describe gear-rental-cache --region=$REGION

# Analyze slow queries
gcloud sql operations list --instance=gear-rental-db
```

#### 4. SSL/Domain Issues
```bash
# Check SSL certificate status
gcloud compute ssl-certificates describe gear-rental-ssl-cert --global

# Verify domain mapping
gcloud run domain-mappings describe --domain=your-domain.com --region=$REGION

# Check DNS configuration
nslookup your-domain.com
```

### Emergency Procedures

#### 1. Rollback Deployment
```bash
# List recent revisions
gcloud run revisions list --service=gear-rental-service --region=$REGION

# Rollback to previous revision
gcloud run services update-traffic gear-rental-service \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=$REGION
```

#### 2. Scale Down in Emergency
```bash
# Temporarily scale down to minimal resources
gcloud run services update gear-rental-service \
  --region=$REGION \
  --min-instances=0 \
  --max-instances=1 \
  --memory=1Gi \
  --cpu=1
```

#### 3. Database Emergency Access
```bash
# Create emergency database user
gcloud sql users create emergency-admin \
  --instance=gear-rental-db \
  --password=SECURE_TEMP_PASSWORD

# Grant temporary access
gcloud sql users set-password emergency-admin \
  --instance=gear-rental-db \
  --password=NEW_SECURE_PASSWORD
```

### Support Contacts
- **Google Cloud Support**: https://cloud.google.com/support/
- **Supabase Support**: https://supabase.com/support
- **Stripe Support**: https://support.stripe.com/
- **Application Issues**: [Your internal support process]

---

## Quick Reference Commands

### Development Commands
```bash
# Local development
npm run dev

# Build and test
npm run build
npm run test
npm run test:e2e

# Database operations
npx prisma migrate dev
npx prisma studio
npx prisma generate
```

### Production Commands
```bash
# Deploy to production
gcloud builds submit --config cloudbuild.yaml

# Check service status
gcloud run services list --region=$REGION

# View logs
gcloud run services logs tail gear-rental-service --region=$REGION

# Update environment variables
gcloud run services update gear-rental-service \
  --set-env-vars KEY=VALUE \
  --region=$REGION
```

### Monitoring Commands
```bash
# Check service health
curl -f https://your-domain.com/api/health

# Monitor metrics
gcloud monitoring metrics list --filter="resource.type=cloud_run_revision"

# View error logs
gcloud logging read 'resource.type="cloud_run_revision" AND severity>=ERROR' --limit=50
```

This comprehensive guide provides everything needed to deploy and maintain the P2P Gear Rental Platform on Google Cloud Platform. Follow the phases sequentially for a successful deployment.