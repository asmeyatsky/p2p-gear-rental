#!/bin/bash
set -e

# =============================================================================
# GitHub Actions + Google Cloud Workload Identity Federation Setup Script
# =============================================================================
#
# This script sets up Workload Identity Federation to allow GitHub Actions
# to deploy to Google Cloud Run without needing service account keys.
#
# Usage:
#   ./scripts/setup-github-actions.sh <github-org/repo>
#
# Example:
#   ./scripts/setup-github-actions.sh myorg/p2p-gear-rental
#
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-p2pgear}"
REGION="${GCP_REGION:-europe-west2}"
POOL_NAME="github"
PROVIDER_NAME="github"
SERVICE_ACCOUNT_NAME="github-actions"
REPO_NAME="p2p-gear-rental-repo"

print_step() {
    echo -e "\n${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if GitHub repo argument is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: GitHub repository not specified${NC}"
    echo ""
    echo "Usage: $0 <github-org/repo>"
    echo "Example: $0 myorg/p2p-gear-rental"
    exit 1
fi

GITHUB_REPO="$1"

echo ""
echo "=============================================="
echo "  GitHub Actions WIF Setup for Cloud Run"
echo "=============================================="
echo ""
echo "Configuration:"
echo "  Project ID:    ${PROJECT_ID}"
echo "  Region:        ${REGION}"
echo "  GitHub Repo:   ${GITHUB_REPO}"
echo ""

# Confirm before proceeding
read -p "Continue with this configuration? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Get project number
print_step "Getting project number..."
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
print_success "Project number: ${PROJECT_NUMBER}"

# Enable required APIs
print_step "Enabling required APIs..."
gcloud services enable \
    iamcredentials.googleapis.com \
    cloudresourcemanager.googleapis.com \
    artifactregistry.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    --project=${PROJECT_ID}
print_success "APIs enabled"

# Create Workload Identity Pool (if not exists)
print_step "Creating Workload Identity Pool..."
if gcloud iam workload-identity-pools describe ${POOL_NAME} \
    --project=${PROJECT_ID} \
    --location="global" &>/dev/null; then
    print_warning "Pool '${POOL_NAME}' already exists, skipping"
else
    gcloud iam workload-identity-pools create ${POOL_NAME} \
        --project=${PROJECT_ID} \
        --location="global" \
        --display-name="GitHub Actions Pool"
    print_success "Created Workload Identity Pool"
fi

# Create Workload Identity Provider (if not exists)
print_step "Creating Workload Identity Provider..."
if gcloud iam workload-identity-pools providers describe ${PROVIDER_NAME} \
    --project=${PROJECT_ID} \
    --location="global" \
    --workload-identity-pool=${POOL_NAME} &>/dev/null; then
    print_warning "Provider '${PROVIDER_NAME}' already exists, skipping"
else
    gcloud iam workload-identity-pools providers create-oidc ${PROVIDER_NAME} \
        --project=${PROJECT_ID} \
        --location="global" \
        --workload-identity-pool=${POOL_NAME} \
        --display-name="GitHub" \
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
        --issuer-uri="https://token.actions.githubusercontent.com"
    print_success "Created Workload Identity Provider"
fi

# Create Service Account (if not exists)
print_step "Creating Service Account..."
SA_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
if gcloud iam service-accounts describe ${SA_EMAIL} --project=${PROJECT_ID} &>/dev/null; then
    print_warning "Service account '${SA_EMAIL}' already exists, skipping"
else
    gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
        --project=${PROJECT_ID} \
        --display-name="GitHub Actions"
    print_success "Created service account"
fi

# Grant permissions to service account
print_step "Granting IAM permissions to service account..."

declare -a ROLES=(
    "roles/artifactregistry.writer"
    "roles/run.admin"
    "roles/iam.serviceAccountUser"
    "roles/cloudsql.client"
    "roles/secretmanager.secretAccessor"
)

for role in "${ROLES[@]}"; do
    echo "  Granting ${role}..."
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="${role}" \
        --condition=None \
        --quiet
done
print_success "IAM permissions granted"

# Allow GitHub to impersonate the service account
print_step "Allowing GitHub repo to impersonate service account..."
gcloud iam service-accounts add-iam-policy-binding ${SA_EMAIL} \
    --project=${PROJECT_ID} \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository/${GITHUB_REPO}"
print_success "GitHub repo authorized"

# Create Artifact Registry repository (if not exists)
print_step "Creating Artifact Registry repository..."
if gcloud artifacts repositories describe ${REPO_NAME} \
    --project=${PROJECT_ID} \
    --location=${REGION} &>/dev/null; then
    print_warning "Repository '${REPO_NAME}' already exists, skipping"
else
    gcloud artifacts repositories create ${REPO_NAME} \
        --project=${PROJECT_ID} \
        --location=${REGION} \
        --repository-format=docker \
        --description="P2P Gear Rental Docker images"
    print_success "Created Artifact Registry repository"
fi

# Get the WIF provider resource name
WIF_PROVIDER_NAME=$(gcloud iam workload-identity-pools providers describe ${PROVIDER_NAME} \
    --project=${PROJECT_ID} \
    --location="global" \
    --workload-identity-pool=${POOL_NAME} \
    --format="value(name)")

# Output the values needed for GitHub secrets
echo ""
echo "=============================================="
echo "  Setup Complete!"
echo "=============================================="
echo ""
echo -e "${GREEN}Add these secrets to your GitHub repository:${NC}"
echo ""
echo "  Settings > Secrets and variables > Actions > New repository secret"
echo ""
echo "┌─────────────────────────────────────────────────────────────────────┐"
echo "│ Secret Name              │ Value                                   │"
echo "├─────────────────────────────────────────────────────────────────────┤"
printf "│ %-24s │ %-40s│\n" "GCP_PROJECT_ID" "${PROJECT_ID}"
echo "├─────────────────────────────────────────────────────────────────────┤"
printf "│ %-24s │ %-40s│\n" "WIF_SERVICE_ACCOUNT" "${SA_EMAIL}"
echo "├─────────────────────────────────────────────────────────────────────┤"
echo "│ WIF_PROVIDER             │ (see below)                             │"
echo "└─────────────────────────────────────────────────────────────────────┘"
echo ""
echo -e "${YELLOW}WIF_PROVIDER value (copy this entire line):${NC}"
echo ""
echo "${WIF_PROVIDER_NAME}"
echo ""
echo "=============================================="
echo ""
echo -e "${BLUE}Optional: Add these for database migrations:${NC}"
echo ""
echo "  CLOUD_SQL_CONNECTION_NAME: <your-cloud-sql-connection-name>"
echo "  DATABASE_URL_FOR_MIGRATIONS: postgresql://user:pass@localhost:5432/dbname"
echo ""
echo "=============================================="
echo ""
echo -e "${GREEN}You're ready to deploy! Push to main to trigger the workflow.${NC}"
echo ""
