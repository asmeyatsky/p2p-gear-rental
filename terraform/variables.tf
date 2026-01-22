# =============================================================================
# Environment Configuration
# =============================================================================

variable "environment" {
  description = "Environment name (stage or prod)"
  type        = string
  validation {
    condition     = contains(["stage", "prod"], var.environment)
    error_message = "Environment must be 'stage' or 'prod'."
  }
}

variable "project_id" {
  description = "The ID of the Google Cloud project"
  type        = string
}

variable "region" {
  description = "The region for the resources"
  type        = string
  default     = "europe-west2" # London
}

# =============================================================================
# Database Configuration
# =============================================================================

variable "use_external_database" {
  description = "Use external database (Supabase) instead of Cloud SQL"
  type        = bool
  default     = false
}

variable "external_database_url" {
  description = "External database URL (when use_external_database = true)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "p2p_rental_user"
}

variable "db_deletion_protection" {
  description = "Enable deletion protection for Cloud SQL"
  type        = bool
  default     = false
}

variable "db_backup_enabled" {
  description = "Enable automated backups for Cloud SQL"
  type        = bool
  default     = true
}

# =============================================================================
# Redis Configuration
# =============================================================================

variable "enable_redis" {
  description = "Enable Redis caching"
  type        = bool
  default     = false
}

variable "redis_memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 1
}

# =============================================================================
# Cloud Run Configuration
# =============================================================================

variable "cloud_run_min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "cloud_run_max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}

variable "cloud_run_memory" {
  description = "Memory limit for Cloud Run instances"
  type        = string
  default     = "512Mi"
}

variable "cloud_run_cpu" {
  description = "CPU limit for Cloud Run instances"
  type        = string
  default     = "1"
}

# =============================================================================
# Storage Configuration
# =============================================================================

variable "storage_lifecycle_age" {
  description = "Age in days before objects are deleted (0 to disable)"
  type        = number
  default     = 0
}

variable "storage_versioning_enabled" {
  description = "Enable versioning for storage bucket"
  type        = bool
  default     = true
}

# =============================================================================
# Application Configuration
# =============================================================================

variable "app_version" {
  description = "Application version tag for the Docker image"
  type        = string
  default     = "latest"
}

variable "repo_name" {
  description = "Name of the source repository"
  type        = string
  default     = "p2p-gear-rental"
}

# =============================================================================
# Secrets / Environment Variables
# =============================================================================

variable "next_public_base_url" {
  description = "Base URL for the application"
  type        = string
}

variable "next_public_supabase_url" {
  description = "Supabase URL"
  type        = string
}

variable "next_public_supabase_anon_key" {
  description = "Supabase anon key"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
  sensitive   = true
}

variable "kms_key_name" {
  description = "KMS key name for encryption (optional)"
  type        = string
  default     = ""
}
