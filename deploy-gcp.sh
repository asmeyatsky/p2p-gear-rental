#!/bin/bash
# P2P Gear Rental - Google Cloud Deployment Script

set -e

echo "🚀 P2P Gear Rental - Google Cloud Deployment"
echo "=============================================="

PROJECT_ID="$1"
REGION="${2:-europe-west2}"
APP_VERSION="${3:-latest}"

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: PROJECT_ID is required"
    echo "Usage: ./deploy.sh PROJECT_ID [REGION] [VERSION]"
    exit 1
fi

echo "📋 Deployment Configuration:"
echo "   Project ID: $PROJECT_ID"
echo "   Region: $REGION"
echo "   Version: $APP_VERSION"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI (gcloud) is not installed"
    echo "   Install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed"
    echo "   Install: https://developer.hashicorp.com/terraform/downloads"
    exit 1
fi

# Authenticate and set project
echo "🔐 Authenticating to Google Cloud..."
gcloud auth login
gcloud config set project $PROJECT_ID

# Enable APIs
echo "📡 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Deploy infrastructure with Terraform
echo "🏗️ Deploying infrastructure with Terraform..."
cd terraform

# Create terraform.tfvars
cat > terraform.tfvars << EOF
project_id = "$PROJECT_ID"
region = "$REGION"
app_version = "$APP_VERSION"
db_tier = "db-f1-micro"
next_public_base_url = "https://p2p-gear-rental-$PROJECT_ID.run.app"
repo_name = "p2p-gear-rental"
EOF

# Initialize and apply Terraform
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars -auto

cd ..

# Get deployment outputs
CLOUD_RUN_URL=$(terraform output -raw cloud_run_url)
echo "🌐 Cloud Run URL: $CLOUD_RUN_URL"

# Build and push Docker image
echo "🐳 Building and pushing Docker image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/p2p-gear-rental:$APP_VERSION .

# Deploy to Cloud Run
echo "🚀 Deploying application to Cloud Run..."
gcloud run deploy p2p-gear-rental \
    --image gcr.io/$PROJECT_ID/p2p-gear-rental:$APP_VERSION \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --set-env-vars DATABASE_URL="$DATABASE_URL" \
    --set-env-vars NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
    --set-env-vars NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
    --set-env-vars STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
    --set-env-vars NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY" \
    --set-env-vars STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Application URL: $CLOUD_RUN_URL"
echo "📊 Expected monthly cost: $36-76"
echo ""
echo "🔧 Next steps:"
echo "   1. Test the application at $CLOUD_RUN_URL"
echo "   2. Set up custom domain if needed"
echo "   3. Configure monitoring and alerts"
echo "   4. Set up backup and disaster recovery"