#!/bin/bash

# P2P Gear Rental - Google Cloud Deployment Script

set -e  # Exit on any error

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}P2P Gear Rental - Google Cloud Deployment Script${NC}"
echo "====================================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud is not installed.${NC}"
    echo "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: terraform is not installed.${NC}"
    echo "Please install Terraform: https://www.terraform.io/downloads"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: docker is not installed.${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Use default project ID or read from user
PROJECT_ID="p2pgear"
read -p "Project ID (default: p2pgear): " USER_INPUT
PROJECT_ID=${USER_INPUT:-$PROJECT_ID}

# Verify project exists
if ! gcloud projects describe "$PROJECT_ID" &> /dev/null; then
    echo -e "${RED}Error: Project $PROJECT_ID does not exist or you don't have access.${NC}"
    exit 1
fi

echo -e "${GREEN}Project $PROJECT_ID verified.${NC}"

# Set project
gcloud config set project "$PROJECT_ID"

# Define region (default to europe-west2 - London, UK)
read -p "Enter region (default: europe-west2): " REGION
REGION=${REGION:-europe-west2}

echo -e "${GREEN}Using region: $REGION${NC}"

# Enable required APIs
echo -e "${BLUE}Enabling required APIs...${NC}"
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project="$PROJECT_ID"

echo -e "${GREEN}APIs enabled successfully.${NC}"

# Navigate to terraform directory
if [ ! -d "terraform" ]; then
    echo -e "${RED}Error: terraform directory not found.${NC}"
    exit 1
fi

cd terraform

# Initialize terraform
echo -e "${BLUE}Initializing Terraform...${NC}"
terraform init

# Create terraform.tfvars file
echo -e "${BLUE}Creating terraform.tfvars file...${NC}"

cat > terraform.tfvars << EOF
project_id                    = "$PROJECT_ID"
region                        = "$REGION"
next_public_base_url          = "https://$PROJECT_ID.uc.r.appspot.com"
next_public_supabase_url      = "https://your-supabase-project.supabase.co"
next_public_supabase_anon_key = "your-supabase-anon-key"
supabase_service_role_key     = "your-supabase-service-key"
stripe_secret_key             = "your-stripe-secret-key"
stripe_webhook_secret         = "your-stripe-webhook-secret"
EOF

echo -e "${YELLOW}Created terraform.tfvars - Please update with your actual values before proceeding.${NC}"

read -p "Do you want to continue with terraform apply? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Applying Terraform configuration...${NC}"
    terraform apply -var-file="terraform.tfvars"
    
    echo -e "${GREEN}Terraform configuration applied successfully!${NC}"
    
    # Show outputs
    echo -e "${BLUE}Deployment outputs:${NC}"
    terraform output
else
    echo -e "${YELLOW}Skipping terraform apply. Please update terraform.tfvars with your values and run 'terraform apply' manually.${NC}"
fi

echo -e "${GREEN}Deployment script completed!${NC}"
echo -e "${YELLOW}For more details, refer to GCP_DEPLOYMENT.md${NC}"