resource "google_sql_database_instance" "default" {
  name             = "p2p-gear-rental-db"
  database_version = "POSTGRES_13"
  region           = var.region

  settings {
    tier = "db-f1-micro"
  }

  deletion_protection = false
}

resource "google_sql_database" "default" {
  name     = "p2p_gear_rental"
  instance = google_sql_database_instance.default.name
}

resource "google_sql_user" "default" {
  name     = "postgres"
  instance = google_sql_database_instance.default.name
  password = var.db_password
}
