# =============================================================================
# Staging Environment Configuration
# =============================================================================
# Estimated Cost: ~$1-5/month
#
# Deploy with:
#   terraform init -backend-config=backends/stage.backend.hcl
#   terraform plan -var-file=environments/stage.tfvars
#   terraform apply -var-file=environments/stage.tfvars
# =============================================================================

environment = "stage"

# =============================================================================
# Database Configuration
# =============================================================================
# Use Supabase free tier for staging to minimize costs
# Set external_database_url via environment variable: TF_VAR_external_database_url

use_external_database = true

# Cloud SQL settings (only used if use_external_database = false)
db_tier                = "db-f1-micro"
db_deletion_protection = false
db_backup_enabled      = false

# =============================================================================
# Redis Configuration
# =============================================================================
# Disabled for staging to minimize costs
# Enable with enable_redis = true (~$36/month additional)

enable_redis         = false
redis_memory_size_gb = 1

# =============================================================================
# Cloud Run Configuration
# =============================================================================
# Minimal resources for staging

cloud_run_min_instances = 0
cloud_run_max_instances = 3
cloud_run_memory        = "512Mi"
cloud_run_cpu           = "1"

# =============================================================================
# Storage Configuration
# =============================================================================
# Enable lifecycle cleanup for staging to reduce costs

storage_lifecycle_age      = 30 # Delete objects after 30 days
storage_versioning_enabled = false

# =============================================================================
# Application Configuration
# =============================================================================
app_version = "simple"

# This must be provided via TF_VAR_* environment variables or at apply time:
#
# TF_VAR_project_id                    - Your GCP project ID
# TF_VAR_next_public_base_url          - e.g., "https://staging.p2p-gear-rental.example.com"
# TF_VAR_next_public_supabase_url      - Your Supabase project URL
# TF_VAR_next_public_supabase_anon_key - Supabase anon key
# TF_VAR_supabase_service_role_key     - Supabase service role key
# TF_VAR_stripe_secret_key             - Stripe test mode secret key
# TF_VAR_stripe_webhook_secret         - Stripe webhook secret
# TF_VAR_external_database_url         - Supabase database URL (when use_external_database = true)
