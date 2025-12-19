# Google Cloud Platform Deployment Guide

This guide provides instructions for deploying the P2P Gear Rental application to Google Cloud Platform using Cloud Run, Cloud SQL, and other managed services.

## Architecture Overview

The application is deployed using:
- **Cloud Run** - Containerized Next.js application
- **Cloud SQL** - PostgreSQL database (compatible with Supabase)
- **Cloud Memorystore** - Redis for caching and sessions
- **Cloud Storage** - For storing gear images
- **Secret Manager** - For API keys and sensitive configuration
- **Artifact Registry** - For storing container images
- **Cloud Build** - For CI/CD pipeline

## Prerequisites

1. Google Cloud Project with billing enabled
2. Google Cloud SDK installed and configured
3. Terraform installed
4. Docker installed
5. Supabase project set up (for authentication and database)

## Step-by-Step Deployment

### 0. Supabase Integration Setup

The P2P Gear Rental application uses Supabase for authentication and database services. You have two options:

**Option A: Use Supabase Cloud (Recommended for quick setup)**
- Sign up at https://supabase.com
- Create a new project
- Get your API URL and anon key from Project Settings > API
- Use these values for the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables

**Option B: Use Cloud SQL with Supabase self-hosting**
- This approach uses Google Cloud SQL as the database backend
- You'll still use Supabase client libraries but point to your Cloud SQL instance
- This provides better data residency and potentially lower costs

For this guide, we'll focus on Option A (Supabase Cloud) as it integrates directly with the existing application code.

### 1. Set up Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="p2pgear"
gcloud config set project $PROJECT_ID
```

### 2. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project=$PROJECT_ID
```

### 3. Create Terraform Variables File

Create a `terraform.tfvars` file in the `terraform/` directory:

```hcl
project_id                    = "p2pgear"
region                        = "europe-west2"  # London (UK)
next_public_base_url          = "https://p2pgear.uc.r.appspot.com"
next_public_supabase_url      = "https://your-project-id.supabase.co"  # Replace with your Supabase project URL
next_public_supabase_anon_key = "your-anon-key"  # From Supabase Project Settings > API
supabase_service_role_key     = "your-service-key"  # From Supabase Project Settings > API
stripe_secret_key             = "sk_test_..."  # Your Stripe secret key
stripe_webhook_secret         = "whsec_..."  # Your Stripe webhook secret
```

### 4. Initialize and Apply Terraform

```bash
cd terraform
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

### 5. Configure Supabase Database Connection

After Terraform creates the Cloud SQL instance, you'll need to connect it to your Supabase project or migrate your existing data. If using Supabase cloud, you just need to update the connection details in your application.

For using Cloud SQL as your database (which is more cost-effective for this setup), you'll need to run your database migrations:

```bash
# Get the database connection name
gcloud sql instances describe ${PROJECT_ID}-p2p-gear-rental-db --format="value(connectionName)"

# Connect to the database using Cloud SQL Proxy or similar tools
# Run your Prisma migrations
cd /path/to/your/app
npx prisma migrate dev
```

### 6. Update Secrets in Secret Manager

After creating the infrastructure, update the secrets with the correct runtime values:

```bash
# Get the Redis instance details
REDIS_HOST=$(gcloud redis instances describe p2p-gear-rental-cache --region=us-central1 --format="value(host)")
REDIS_PORT=$(gcloud redis instances describe p2p-gear-rental-cache --region=us-central1 --format="value(port)")

# Update the Redis URL secret with actual values
echo "redis://${REDIS_HOST}:${REDIS_PORT}/0" | gcloud secrets versions add redis-url --data-file=-
```

### 7. Configure Cloud Build Trigger

If you want to automate deployments, make sure your repository is connected to Cloud Source Repositories or GitHub/Bitbucket:

```bash
# Add your source repository (if using Cloud Source Repositories)
gcloud source repos create p2p-gear-rental

# Or create a trigger for GitHub/GitLab
gcloud builds triggers create github \
    --name="p2p-gear-rental" \
    --repo-name="p2p-gear-rental" \
    --repo-owner="your-github-username" \
    --branch-pattern="main" \
    --build-config="cloudbuild.yaml"
```

### 8. Manual Deployment (Alternative to Cloud Build)

If you prefer to deploy manually:

```bash
# Build the image
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/$PROJECT_ID-p2p-gear-rental:latest .

# Tag and push to Artifact Registry
docker tag us-central1-docker.pkg.dev/$PROJECT_ID/$PROJECT_ID-p2p-gear-rental:latest
docker push us-central1-docker.pkg.dev/$PROJECT_ID/$PROJECT_ID-p2p-gear-rental:latest

# Deploy to Cloud Run
gcloud run deploy p2p-gear-rental \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/$PROJECT_ID-p2p-gear-rental:latest \
  --platform managed \
  --region us-central1 \
  --port 3000 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_BASE_URL=https://your-app.uc.r.appspot.com \
  --set-env-vars NEXT_PUBLIC_SUPABASE_URL=your-supabase-url \
  --set-env-vars NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key \
  --set-env-vars REDIS_URL=redis://[REDIS_HOST]:[REDIS_PORT]/0 \
  --set-secrets SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest \
  --set-secrets STRIPE_SECRET_KEY=stripe-secret-key:latest \
  --set-secrets STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300s
```

### 9. Configure Custom Domain (Optional)

```bash
# Map your custom domain
gcloud run domain-mappings create \
  --service=p2p-gear-rental \
  --domain=yourdomain.com \
  --region=us-central1
```

### 10. Setup Cloud Storage for Images

The Terraform configuration creates a Cloud Storage bucket. You'll need to configure your Next.js app to upload to this bucket:

```javascript
// Example of how to configure in your app
const {
  Storage
} = require('@google-cloud/storage');

const storage = new Storage();
const bucket = storage.bucket('your-bucket-name');
```

## Environment Variables Reference

The following environment variables are configured in the deployment:

| Variable | Purpose | Source |
|----------|---------|---------|
| NEXT_PUBLIC_BASE_URL | Application base URL | Secret Manager |
| NEXT_PUBLIC_SUPABASE_URL | Supabase API URL | Secret Manager |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key | Secret Manager |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key | Secret Manager |
| STRIPE_SECRET_KEY | Stripe API secret | Secret Manager |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret | Secret Manager |
| REDIS_URL | Redis connection string | Runtime configuration |

## Security Considerations

1. **API Keys**: All sensitive API keys are stored in Secret Manager and accessed at runtime
2. **HTTPS**: All traffic is encrypted via HTTPS
3. **Authentication**: Cloud Run service allows unauthenticated requests by default; adjust IAM as needed
4. **Database**: Cloud SQL is configured with SSL requirement and backup enabled
5. **Redis**: Redis instance is configured with appropriate security settings

## Scaling Configuration

The Cloud Run service is configured with:
- Minimum 0 instances (scales down when not in use)
- Maximum 10 instances (adjustable based on needs)
- 1GB memory and 1 CPU per instance
- 5-minute timeout for requests

## Monitoring and Logging

Monitor your application using:
- Cloud Run console for request metrics
- Cloud Logging for application logs
- Cloud Monitoring for custom metrics
- Error Reporting for error tracking

## Troubleshooting

### Common Issues:

1. **Container Build Failures**: Check if all dependencies are properly specified
2. **Secret Access Issues**: Verify service account permissions for Secret Manager
3. **Database Connection Issues**: Ensure proper VPC configuration if using private IP
4. **Cold Start Delays**: Consider setting minimum instances to 1 for production

### Useful Commands:

```bash
# View Cloud Run logs
gcloud run services logs read p2p-gear-rental --region=europe-west2

# Get service URL
gcloud run services describe p2p-gear-rental --region=europe-west2 --format="value(status.url)"

# Check Secret Manager access
gcloud secrets versions access latest --secret="your-secret-name"
```

## Running the Deployment Script

We've provided a deployment script to automate the setup process:

```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

The script will:
1. Verify prerequisites (gcloud, terraform, docker)
2. Enable required APIs
3. Create and configure the terraform.tfvars file
4. Initialize and apply Terraform configuration

## Cost Estimate for UK Deployment

Here's a breakdown of expected monthly costs for running the P2P Gear Rental application in the UK (europe-west2):

### Cloud Run (Application Hosting)
- **Request Processing**: ~£0.32 per million requests
- **Container Instance Memory**: ~£0.24 per GB-month
- **Container Instance VCPU**: ~£2.65 per vCPU-month
- **Monthly estimate (low-medium usage)**: £5-15/month

### Cloud SQL (Database)
- **db-f1-micro instance**: £8.45/month (1 vCPU, 614.4 MB RAM)
- **10GB storage**: £0.57/GB-month = £5.70/month
- **Total Cloud SQL**: ~£14.15/month

### Cloud Memorystore (Redis)
- **Basic Redis instance (1GB)**: ~£7.73/month
- **Dedicated memory**: ~£0.069/GB-hour = ~£50/month (if using more memory)

### Cloud Storage (Images)
- **Standard storage**: £0.0205/GB-month
- **100GB storage**: ~£2.05/month
- **Network egress**: ~£0.12/GB

### Other Services
- **Secret Manager**: £0.06 per 10,000 accesses (minimal cost)
- **Cloud Build**: £0.05 per build minute (only during deployments)
- **Artifact Registry**: £0.12/GB-month for stored images

### Estimated Monthly Costs by Usage Level:

**Low Usage (Development/Test)**:
- 10,000 monthly requests
- 1GB storage
- 0.5GB Redis
- **Total**: £25-35/month

**Medium Usage (Small Production)**:
- 100,000 monthly requests
- 10GB storage
- 1GB Redis
- 1 active Cloud Run instance
- **Total**: £35-50/month

**High Usage (Production)**:
- 1,000,000+ monthly requests
- 50GB+ storage
- 2GB+ Redis
- Multiple Cloud Run instances during peak
- **Total**: £75-120/month

### Cost Optimization Tips

1. Use regional Cloud SQL instance in the same region (europe-west2) as Cloud Run to minimize network costs
2. Implement appropriate caching with Redis to reduce database load and Cloud Run execution time
3. Use minimum instances of 0 for development environments (scales down when not in use)
4. Set up billing alerts to monitor costs: `gcloud beta billing budgets create --billing-account=YOUR-BILLING-ACCOUNT --display-name="P2P Gear Budget" --budget-amount=100`
5. Use Cloud Build only when needed for CI/CD - avoid continuous builds
6. Implement image optimization to reduce Cloud Storage costs
7. Consider using Cloud SQL's automatic storage increase feature to avoid manual adjustments
8. Use Cloud Run's concurrency settings to optimize resource usage

## Next Steps

1. After deployment, verify your application is running at the URL provided in Terraform outputs
2. Update your domain's DNS settings if using a custom domain
3. Configure SSL certificates for custom domains
4. Set up monitoring and alerting for production environments
5. Test the complete application flow including auth, payments, and gear listings

This deployment provides a scalable, secure, and cost-effective hosting solution for your P2P Gear Rental application on Google Cloud Platform.