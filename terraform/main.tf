terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Configure the Google Cloud provider
provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "services" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com", 
    "redis.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com"
  ])

  service = each.value

  # Don't disable APIs that are enabled by default
  disable_on_destroy = false
}

# Create Artifact Registry for container images
resource "google_artifact_registry_repository" "app_repository" {
  location      = var.region
  repository_id = "${var.project_id}-p2p-gear-rental"
  format        = "DOCKER"
  description   = "Docker repository for p2p-gear-rental application"
}

# Cloud SQL instance for the database
resource "google_sql_database_instance" "instance" {
  name             = "${var.project_id}-p2p-gear-rental-db"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = var.db_tier

    # Database flags required for Supabase compatibility
    database_flags {
      name  = "cloudsql.iam.auth.enabled"
      value = "true"
    }

    ip_configuration {
      ipv4_enabled    = true
      require_ssl     = true
      authorized_networks {
        name  = "all"
        value = "0.0.0.0/0"  # In production, restrict this to specific IPs
      }
    }

    backup_configuration {
      enabled            = true
      automatic          = true
      point_in_time_recovery_enabled = true
      location          = var.region
    }

    encryption {
      kms_key_name = var.kms_key_name
    }
  }

  deletion_protection = false  # Set to true in production
}

# Database for the application
resource "google_sql_database" "database" {
  name     = "p2p_gear_rental_db"
  instance = google_sql_database_instance.instance.name
}

# Cloud SQL user for the application
resource "google_sql_user" "db_user" {
  name     = var.db_username
  instance = google_sql_database_instance.instance.name
  password = random_password.db_password.result
}

# Redis instance for caching/session storage
resource "google_redis_instance" "cache" {
  name           = "${var.project_id}-p2p-gear-rental-cache"
  tier           = "BASIC"
  memory_size_gb = 1

  display_name = "Redis instance for p2p-gear-rental"
  region       = var.region

  redis_version = "redis_6_x"

  # Configure Redis settings
  redis_configs = {
    maxmemory-policy = "allkeys-lru"
  }
}

# Cloud Storage bucket for file uploads
resource "google_storage_bucket" "gear_images" {
  name                        = "${var.project_id}-p2p-gear-rental-images"
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  versioning {
    enabled = true
  }

  labels = {
    purpose = "gear-images"
  }
}

# Cloud Run service for the application
resource "google_cloud_run_service" "app" {
  name     = "p2p-gear-rental"
  location = var.region

  template {
    spec {
      containers {
        image = "${google_artifact_registry_repository.app_repository.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app_repository.name}/p2p-gear-rental:${var.app_version}"

        # Environment variables from Secret Manager
        env {
          name = "NEXT_PUBLIC_BASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.next_public_base_url.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "NEXT_PUBLIC_SUPABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.next_public_supabase_url.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.next_public_supabase_anon_key.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "SUPABASE_SERVICE_ROLE_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.supabase_service_role_key.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "STRIPE_SECRET_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.stripe_secret_key.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "STRIPE_WEBHOOK_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.stripe_webhook_secret.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "REDIS_URL"
          value = "redis://${google_redis_instance.cache.host}:${google_redis_instance.cache.port}/0"
        }

        # Health check configuration
        liveness_probe {
          http_get {
            path = "/api/health"
            port = 3000
          }
          initial_delay_seconds = 30
          period_seconds        = 10
          timeout_seconds       = 5
          failure_threshold     = 3
        }

        readiness_probe {
          http_get {
            path = "/api/health"
            port = 3000
          }
          initial_delay_seconds = 5
          period_seconds        = 5
          timeout_seconds       = 3
          failure_threshold     = 3
        }

        # Resource limits
        resources {
          limits = {
            memory = "1Gi"
            cpu    = "1"
          }
          requests = {
            memory = "256Mi"
            cpu    = "250m"
          }
        }
      }

      # Set timeout and concurrency
      timeout_seconds = 300
      container_concurrency = 80
    }

    metadata {
      annotations = {
        # Enable HTTPS only
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }

  # Allow unauthenticated requests - adjust as needed for security
  traffic {
    percent = 100
    latest_revision = true
  }
}

# IAM policy for Cloud Run service to allow public access
resource "google_cloud_run_service_iam_member" "public" {
  service  = google_cloud_run_service.app.name
  location = google_cloud_run_service.app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Secret Manager secrets
resource "random_password" "db_password" {
  length  = 16
  special = true
}

resource "google_secret_manager_secret" "next_public_base_url" {
  secret_id = "next-public-base-url"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "next_public_base_url_version" {
  secret      = google_secret_manager_secret.next_public_base_url.id
  secret_data = var.next_public_base_url
}

resource "google_secret_manager_secret" "next_public_supabase_url" {
  secret_id = "next-public-supabase-url"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "next_public_supabase_url_version" {
  secret      = google_secret_manager_secret.next_public_supabase_url.id
  secret_data = var.next_public_supabase_url
}

resource "google_secret_manager_secret" "next_public_supabase_anon_key" {
  secret_id = "next-public-supabase-anon-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "next_public_supabase_anon_key_version" {
  secret      = google_secret_manager_secret.next_public_supabase_anon_key.id
  secret_data = var.next_public_supabase_anon_key
}

resource "google_secret_manager_secret" "supabase_service_role_key" {
  secret_id = "supabase-service-role-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "supabase_service_role_key_version" {
  secret      = google_secret_manager_secret.supabase_service_role_key.id
  secret_data = var.supabase_service_role_key
}

resource "google_secret_manager_secret" "stripe_secret_key" {
  secret_id = "stripe-secret-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "stripe_secret_key_version" {
  secret      = google_secret_manager_secret.stripe_secret_key.id
  secret_data = var.stripe_secret_key
}

resource "google_secret_manager_secret" "stripe_webhook_secret" {
  secret_id = "stripe-webhook-secret"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "stripe_webhook_secret_version" {
  secret      = google_secret_manager_secret.stripe_webhook_secret.id
  secret_data = var.stripe_webhook_secret
}

resource "google_secret_manager_secret" "redis_password" {
  secret_id = "redis-password"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "redis_password_version" {
  secret      = google_secret_manager_secret.redis_password.id
  secret_data = random_password.db_password.result
}

# Cloud Build trigger for CI/CD
resource "google_cloudbuild_trigger" "build_trigger" {
  name        = "p2p-gear-rental-build"
  description = "Build and deploy p2p-gear-rental to Cloud Run"
  
  trigger_template {
    branch_name = "main"
    repo_name   = var.repo_name
  }

  filename = "cloudbuild.yaml"
}