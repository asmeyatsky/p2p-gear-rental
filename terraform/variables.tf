variable "project_id" {
  description = "The ID of the Google Cloud project"
  type        = string
}

variable "region" {
  description = "The region for the resources"
  type        = string
  default     = "europe-west2"  # London
}

variable "app_version" {
  description = "Application version tag for the Docker image"
  type        = string
  default     = "latest"
}

variable "db_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "kms_key_name" {
  description = "KMS key name for encryption (optional)"
  type        = string
  default     = ""
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "p2p_rental_user"
}

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
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
}

variable "repo_name" {
  description = "Name of the source repository"
  type        = string
  default     = "p2p-gear-rental"
}