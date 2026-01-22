# =============================================================================
# Production Environment Backend Configuration
# =============================================================================
# This file configures the GCS backend for storing Terraform state for production.
#
# Before first use, create the state bucket (if not already created):
#   gcloud storage buckets create gs://YOUR_PROJECT_ID-terraform-state \
#     --location=europe-west2 \
#     --uniform-bucket-level-access
#
# Initialize with:
#   terraform init -backend-config=backends/prod.backend.hcl -reconfigure
# =============================================================================

bucket = "p2pgear-terraform-state"
prefix = "prod"
