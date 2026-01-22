# =============================================================================
# Output Values
# =============================================================================

output "environment" {
  value       = var.environment
  description = "The deployment environment (stage or prod)"
}

output "cloud_run_url" {
  value       = google_cloud_run_service.app.status[0].url
  description = "The URL of the deployed Cloud Run service"
}

output "cloud_run_name" {
  value       = google_cloud_run_service.app.name
  description = "Name of the Cloud Run service"
}

# =============================================================================
# Database Outputs (conditional)
# =============================================================================

output "database_connection_name" {
  value       = var.use_external_database ? "external (Supabase)" : try(google_sql_database_instance.instance[0].connection_name, "not created")
  description = "Connection name for the Cloud SQL instance (or 'external' if using Supabase)"
}

output "database_instance_name" {
  value       = var.use_external_database ? null : try(google_sql_database_instance.instance[0].name, null)
  description = "Name of the Cloud SQL instance"
}

output "database_public_ip" {
  value       = var.use_external_database ? null : try(google_sql_database_instance.instance[0].public_ip_address, null)
  description = "Public IP address of the Cloud SQL instance"
  sensitive   = true
}

# =============================================================================
# Redis Outputs (conditional)
# =============================================================================

output "redis_enabled" {
  value       = var.enable_redis
  description = "Whether Redis caching is enabled"
}

output "redis_endpoint" {
  value       = var.enable_redis ? try("${google_redis_instance.cache[0].host}:${google_redis_instance.cache[0].port}", null) : null
  description = "Redis endpoint for caching (null if disabled)"
}

# =============================================================================
# Storage Outputs
# =============================================================================

output "storage_bucket_name" {
  value       = google_storage_bucket.gear_images.name
  description = "Name of the storage bucket for gear images"
}

output "storage_bucket_url" {
  value       = "https://console.cloud.google.com/storage/browser/${google_storage_bucket.gear_images.name}"
  description = "URL to access the storage bucket in GCP Console"
}

# =============================================================================
# Artifact Registry Outputs
# =============================================================================

output "artifact_registry_repo" {
  value       = google_artifact_registry_repository.app_repository.repository_id
  description = "Name of the artifact registry repository"
}

output "docker_image_path" {
  value       = "${google_artifact_registry_repository.app_repository.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app_repository.repository_id}/p2p-gear-rental"
  description = "Full path for Docker images in Artifact Registry"
}

# =============================================================================
# Configuration Summary
# =============================================================================

output "configuration_summary" {
  value = {
    environment           = var.environment
    region                = var.region
    database_type         = var.use_external_database ? "external (Supabase)" : "Cloud SQL"
    redis_enabled         = var.enable_redis
    cloud_run_min_scale   = var.cloud_run_min_instances
    cloud_run_max_scale   = var.cloud_run_max_instances
    cloud_run_memory      = var.cloud_run_memory
    cloud_run_cpu         = var.cloud_run_cpu
    storage_versioning    = var.storage_versioning_enabled
    storage_lifecycle_age = var.storage_lifecycle_age > 0 ? "${var.storage_lifecycle_age} days" : "disabled"
  }
  description = "Summary of the deployment configuration"
}
