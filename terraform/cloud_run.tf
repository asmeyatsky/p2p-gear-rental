resource "google_cloud_run_v2_service" "default" {
  name     = "p2p-gear-rental"
  location = var.region

  template {
    containers {
      image = "gcr.io/${var.project_id}/p2p-gear-rental:latest"
      ports {
        container_port = 3000
      }

      env {
        name  = "DATABASE_URL"
        value = "postgresql://postgres:${var.db_password}@/${google_sql_database_instance.default.name}/${google_sql_database.default.name}"
      }
      env {
        name  = "NEXT_PUBLIC_SUPABASE_URL"
        value = var.supabase_url
      }
      env {
        name  = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        value = var.supabase_anon_key
      }
      env {
        name  = "SUPABASE_SERVICE_ROLE_KEY"
        value = var.supabase_service_role_key
      }
      env {
        name  = "STRIPE_SECRET_KEY"
        value = var.stripe_secret_key
      }
      env {
        name  = "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
        value = var.stripe_publishable_key
      }
      env {
        name  = "STRIPE_WEBHOOK_SECRET"
        value = var.stripe_webhook_secret
      }
    }
  }

  traffic {
    percent         = 100
    type            = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [
    google_project_service.run,
    google_sql_database_instance.default
  ]
}

output "cloud_run_url" {
  value = google_cloud_run_v2_service.default.uri
}
