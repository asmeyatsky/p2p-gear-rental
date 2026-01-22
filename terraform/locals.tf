# =============================================================================
# Environment-Aware Naming Conventions
# =============================================================================

locals {
  # Naming prefixes
  name_prefix    = "${var.project_id}-${var.environment}"
  cloud_run_name = "p2p-gear-rental-${var.environment}"

  # Resource names
  db_instance_name    = "${local.name_prefix}-db"
  db_name             = "p2p_gear_rental_${var.environment}"
  redis_name          = "${local.name_prefix}-cache"
  storage_bucket_name = "${local.name_prefix}-images"
  artifact_repo_name  = "${local.name_prefix}-repo"
  build_trigger_name  = "p2p-gear-rental-${var.environment}-build"

  # Secret naming prefix
  secret_prefix = var.environment

  # Database URL construction
  # When using external database (Supabase), use the provided URL
  # When using Cloud SQL, construct the URL from Cloud SQL resources
  database_url = var.use_external_database ? var.external_database_url : (
    length(google_sql_database_instance.instance) > 0 ? (
      "postgresql://${var.db_username}:${random_password.db_password.result}@/${google_sql_database.database[0].name}?host=/cloudsql/${google_sql_database_instance.instance[0].connection_name}"
    ) : ""
  )

  # Redis URL (empty if disabled)
  redis_url = var.enable_redis && length(google_redis_instance.cache) > 0 ? (
    "redis://${google_redis_instance.cache[0].host}:${google_redis_instance.cache[0].port}/0"
  ) : ""

  # Common labels for all resources
  common_labels = {
    environment = var.environment
    project     = "p2p-gear-rental"
    managed_by  = "terraform"
  }
}
