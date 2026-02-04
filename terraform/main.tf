# =============================================================================
# Terraform Configuration
# =============================================================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Backend configuration is provided via -backend-config flag
  # See backends/stage.backend.hcl and backends/prod.backend.hcl
  backend "gcs" {}
}

# =============================================================================
# Provider Configuration
# =============================================================================

provider "google" {
  project = var.project_id
  region  = var.region
}

# =============================================================================
# Enable Required APIs
# =============================================================================

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

  service            = each.value
  disable_on_destroy = false
}

# =============================================================================
# Random Password for Database
# =============================================================================

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# =============================================================================
# Artifact Registry
# =============================================================================

resource "google_artifact_registry_repository" "app_repository" {
  location      = var.region
  repository_id = local.artifact_repo_name
  format        = "DOCKER"
  description   = "Docker repository for p2p-gear-rental (${var.environment})"

  labels = local.common_labels

  depends_on = [google_project_service.services]
}

# =============================================================================
# Cloud SQL (Conditional - disabled when using external database)
# =============================================================================

resource "google_sql_database_instance" "instance" {
  count = var.use_external_database ? 0 : 1

  name             = local.db_instance_name
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = var.db_tier

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }

    ip_configuration {
      ipv4_enabled = true
      require_ssl  = true
      authorized_networks {
        name  = "all"
        value = "0.0.0.0/0" # In production, restrict to specific IPs
      }
    }

    backup_configuration {
      enabled                        = var.db_backup_enabled
      start_time                     = "03:00"
      point_in_time_recovery_enabled = var.db_backup_enabled
      location                       = var.region
    }

    user_labels = local.common_labels
  }

  deletion_protection = var.db_deletion_protection

  depends_on = [google_project_service.services]
}

resource "google_sql_database" "database" {
  count = var.use_external_database ? 0 : 1

  name     = local.db_name
  instance = google_sql_database_instance.instance[0].name
}

resource "google_sql_user" "db_user" {
  count = var.use_external_database ? 0 : 1

  name     = var.db_username
  instance = google_sql_database_instance.instance[0].name
  password = random_password.db_password.result
}

# =============================================================================
# Redis (Conditional - disabled by default)
# =============================================================================

resource "google_redis_instance" "cache" {
  count = var.enable_redis ? 1 : 0

  name           = local.redis_name
  tier           = "BASIC"
  memory_size_gb = var.redis_memory_size_gb
  region         = var.region

  display_name  = "Redis cache for p2p-gear-rental (${var.environment})"
  redis_version = "REDIS_7_0"

  redis_configs = {
    maxmemory-policy = "allkeys-lru"
  }

  labels = local.common_labels

  depends_on = [google_project_service.services]
}

# =============================================================================
# Cloud Storage
# =============================================================================

resource "google_storage_bucket" "gear_images" {
  name                        = local.storage_bucket_name
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true

  # Lifecycle rule (only apply if storage_lifecycle_age > 0)
  dynamic "lifecycle_rule" {
    for_each = var.storage_lifecycle_age > 0 ? [1] : []
    content {
      condition {
        age = var.storage_lifecycle_age
      }
      action {
        type = "Delete"
      }
    }
  }

  versioning {
    enabled = var.storage_versioning_enabled
  }

  labels = local.common_labels

  depends_on = [google_project_service.services]
}

# =============================================================================
# Secret Manager
# =============================================================================

resource "google_secret_manager_secret" "database_url" {
  secret_id = "${local.secret_prefix}-database-url"

  replication {
    auto {}
  }

  labels = local.common_labels

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = local.database_url
}

resource "google_secret_manager_secret" "next_public_base_url" {
  secret_id = "${local.secret_prefix}-next-public-base-url"

  replication {
    auto {}
  }

  labels = local.common_labels

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "next_public_base_url" {
  secret      = google_secret_manager_secret.next_public_base_url.id
  secret_data = var.next_public_base_url
}

resource "google_secret_manager_secret" "next_public_supabase_url" {
  secret_id = "${local.secret_prefix}-next-public-supabase-url"

  replication {
    auto {}
  }

  labels = local.common_labels

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "next_public_supabase_url" {
  secret      = google_secret_manager_secret.next_public_supabase_url.id
  secret_data = var.next_public_supabase_url
}

resource "google_secret_manager_secret" "next_public_supabase_anon_key" {
  secret_id = "${local.secret_prefix}-next-public-supabase-anon-key"

  replication {
    auto {}
  }

  labels = local.common_labels

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "next_public_supabase_anon_key" {
  secret      = google_secret_manager_secret.next_public_supabase_anon_key.id
  secret_data = var.next_public_supabase_anon_key
}

resource "google_secret_manager_secret" "supabase_service_role_key" {
  secret_id = "${local.secret_prefix}-supabase-service-role-key"

  replication {
    auto {}
  }

  labels = local.common_labels

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "supabase_service_role_key" {
  secret      = google_secret_manager_secret.supabase_service_role_key.id
  secret_data = var.supabase_service_role_key
}

resource "google_secret_manager_secret" "stripe_secret_key" {
  secret_id = "${local.secret_prefix}-stripe-secret-key"

  replication {
    auto {}
  }

  labels = local.common_labels

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "stripe_secret_key" {
  secret      = google_secret_manager_secret.stripe_secret_key.id
  secret_data = var.stripe_secret_key
}

resource "google_secret_manager_secret" "stripe_webhook_secret" {
  secret_id = "${local.secret_prefix}-stripe-webhook-secret"

  replication {
    auto {}
  }

  labels = local.common_labels

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "stripe_webhook_secret" {
  secret      = google_secret_manager_secret.stripe_webhook_secret.id
  secret_data = var.stripe_webhook_secret
}

# =============================================================================
# Cloud Run Service
# =============================================================================

resource "google_cloud_run_service" "app" {
  name     = local.cloud_run_name
  location = var.region

  template {
    spec {
      containers {
        image = "${google_artifact_registry_repository.app_repository.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app_repository.repository_id}/p2p-gear-rental:${var.app_version}"

        # Database URL
        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.database_url.secret_id
              key  = "latest"
            }
          }
        }

        # Application URLs
        env {
          name = "NEXT_PUBLIC_BASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.next_public_base_url.secret_id
              key  = "latest"
            }
          }
        }

        # Supabase Configuration
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

        # Stripe Configuration
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

        # Redis URL (only set if Redis is enabled)
        dynamic "env" {
          for_each = var.enable_redis ? [1] : []
          content {
            name  = "REDIS_URL"
            value = local.redis_url
          }
        }

        # Environment identifier
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }

        # Health check configuration
        # Using startup_probe for initial container startup
        startup_probe {
          http_get {
            path = "/api/health"
          }
          initial_delay_seconds = 0
          period_seconds        = 10
          timeout_seconds       = 3
          failure_threshold     = 3
        }

        # Liveness probe for ongoing health checks
        liveness_probe {
          http_get {
            path = "/api/health"
          }
          initial_delay_seconds = 0
          period_seconds        = 10
          timeout_seconds       = 3
          failure_threshold     = 3
        }

        # Resource limits
        resources {
          limits = {
            memory = var.cloud_run_memory
            cpu    = var.cloud_run_cpu
          }
        }
      }

      timeout_seconds       = 300
      container_concurrency = 80
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = tostring(var.cloud_run_min_instances)
        "autoscaling.knative.dev/maxScale" = tostring(var.cloud_run_max_instances)
      }
      labels = local.common_labels
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.services,
    google_secret_manager_secret_version.database_url,
    google_secret_manager_secret_version.next_public_base_url,
    google_secret_manager_secret_version.next_public_supabase_url,
    google_secret_manager_secret_version.next_public_supabase_anon_key,
    google_secret_manager_secret_version.supabase_service_role_key,
    google_secret_manager_secret_version.stripe_secret_key,
    google_secret_manager_secret_version.stripe_webhook_secret,
  ]
}

# IAM policy for Cloud Run service to allow public access
resource "google_cloud_run_service_iam_member" "public" {
  service  = google_cloud_run_service.app.name
  location = google_cloud_run_service.app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Grant Cloud Run service account access to secrets
data "google_project" "project" {}

resource "google_secret_manager_secret_iam_member" "cloud_run_secrets" {
  for_each = toset([
    google_secret_manager_secret.database_url.secret_id,
    google_secret_manager_secret.next_public_base_url.secret_id,
    google_secret_manager_secret.next_public_supabase_url.secret_id,
    google_secret_manager_secret.next_public_supabase_anon_key.secret_id,
    google_secret_manager_secret.supabase_service_role_key.secret_id,
    google_secret_manager_secret.stripe_secret_key.secret_id,
    google_secret_manager_secret.stripe_webhook_secret.secret_id,
  ])

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

# =============================================================================
# Cloud Build Trigger (only for production)
# =============================================================================

resource "google_cloudbuild_trigger" "build_trigger" {
  count = var.environment == "prod" ? 1 : 0

  name        = local.build_trigger_name
  description = "Build and deploy p2p-gear-rental to Cloud Run (${var.environment})"

  trigger_template {
    branch_name = "main"
    repo_name   = var.repo_name
  }

  filename = "cloudbuild.yaml"

  depends_on = [google_project_service.services]
}
