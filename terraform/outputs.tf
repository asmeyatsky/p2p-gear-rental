output "cloud_run_url" {
  value       = google_cloud_run_service.app.status[0].url
  description = "The URL of the deployed Cloud Run service"
}

output "database_connection_name" {
  value       = google_sql_database_instance.instance.connection_name
  description = "Connection name for the Cloud SQL instance"
}

output "redis_endpoint" {
  value       = "${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
  description = "Redis endpoint for caching"
}

output "storage_bucket_url" {
  value       = "https://console.cloud.google.com/storage/browser/${google_storage_bucket.gear_images.name}"
  description = "URL to access the storage bucket"
}

output "artifact_registry_repo" {
  value       = google_artifact_registry_repository.app_repository.name
  description = "Name of the artifact registry repository"
}