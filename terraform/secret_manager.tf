resource "google_secret_manager_secret" "db_password" {
  secret_id = "db_password"

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "db_password_version" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}

resource "google_secret_manager_secret" "supabase_service_role_key" {
  secret_id = "supabase_service_role_key"

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "supabase_service_role_key_version" {
  secret      = google_secret_manager_secret.supabase_service_role_key.id
  secret_data = var.supabase_service_role_key
}

resource "google_secret_manager_secret" "stripe_secret_key" {
  secret_id = "stripe_secret_key"

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "stripe_secret_key_version" {
  secret      = google_secret_manager_secret.stripe_secret_key.id
  secret_data = var.stripe_secret_key
}

resource "google_secret_manager_secret" "stripe_webhook_secret" {
  secret_id = "stripe_webhook_secret"

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "stripe_webhook_secret_version" {
  secret      = google_secret_manager_secret.stripe_webhook_secret.id
  secret_data = var.stripe_webhook_secret
}
