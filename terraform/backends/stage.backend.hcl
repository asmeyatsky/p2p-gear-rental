# =============================================================================
# Staging Environment Backend Configuration
# =============================================================================
# This file configures the GCS backend for storing Terraform state for staging.
#
# Before first use, create the state bucket:
#   gcloud storage buckets create gs://YOUR_PROJECT_ID-terraform-state \
#     --location=europe-west2 \
#     --uniform-bucket-level-access
#
# Initialize with:
#   terraform init -backend-config=backends/stage.backend.hcl
# =============================================================================

bucket = "p2pgear-terraform-state"
prefix = "stage"
