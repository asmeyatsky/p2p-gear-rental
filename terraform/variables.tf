variable "project_id" {
  description = "The GCP project ID."
  type        = string
}

variable "region" {
  description = "The GCP region for resources."
  type        = string
  default     = "us-central1"
}

variable "db_password" {
  description = "The password for the database user."
  type        = string
  sensitive   = true
}

variable "supabase_url" {
  description = "The Supabase project URL."
  type        = string
}

variable "supabase_anon_key" {
  description = "The Supabase anon key."
  type        = string
}

variable "supabase_service_role_key" {
  description = "The Supabase service role key."
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "The Stripe secret key."
  type        = string
  sensitive   = true
}

variable "stripe_publishable_key" {
  description = "The Stripe publishable key."
  type        = string
}

variable "stripe_webhook_secret" {
  description = "The Stripe webhook secret."
  type        = string
  sensitive   = true
}
