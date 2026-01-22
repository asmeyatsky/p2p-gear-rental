# =============================================================================
# Production Environment Configuration
# =============================================================================
# Estimated Cost: ~$15-25/month (without Redis)
#                 ~$50-60/month (with Redis enabled)
#
# Deploy with:
#   terraform init -backend-config=backends/prod.backend.hcl -reconfigure
#   terraform plan -var-file=environments/prod.tfvars
#   terraform apply -var-file=environments/prod.tfvars
# =============================================================================

environment = "prod"

# =============================================================================
# Database Configuration
# =============================================================================
# Use Cloud SQL for production (managed PostgreSQL)

use_external_database  = false
db_tier                = "db-f1-micro" # ~$10/month, upgrade to db-g1-small for more capacity
db_deletion_protection = true          # Prevent accidental deletion
db_backup_enabled      = true          # Enable automated backups

# =============================================================================
# Redis Configuration
# =============================================================================
# Disabled initially to minimize costs
# Enable with enable_redis = true when caching is needed (~$36/month additional)

enable_redis         = false
redis_memory_size_gb = 1

# =============================================================================
# Cloud Run Configuration
# =============================================================================
# Production-ready resources

cloud_run_min_instances = 0  # Scale to zero when idle to save costs
cloud_run_max_instances = 10 # Allow scaling up to 10 instances
cloud_run_memory        = "1Gi"
cloud_run_cpu           = "1"

# =============================================================================
# Storage Configuration
# =============================================================================
# Enable versioning for data protection, no automatic cleanup

storage_lifecycle_age      = 0    # No automatic deletion
storage_versioning_enabled = true # Enable versioning for data protection

# =============================================================================
# Secrets (Set via Environment Variables)
# =============================================================================
# These must be provided via TF_VAR_* environment variables or at apply time:
#
# TF_VAR_project_id                    - Your GCP project ID
# TF_VAR_next_public_base_url          - e.g., "https://p2p-gear-rental.example.com"
# TF_VAR_next_public_supabase_url      - Your Supabase project URL
# TF_VAR_next_public_supabase_anon_key - Supabase anon key
# TF_VAR_supabase_service_role_key     - Supabase service role key
# TF_VAR_stripe_secret_key             - Stripe live mode secret key
# TF_VAR_stripe_webhook_secret         - Stripe webhook secret
