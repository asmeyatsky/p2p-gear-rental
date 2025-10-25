resource "google_artifact_registry_repository" "default" {
  location      = var.region
  repository_id = "p2p-gear-rental-repo"
  description   = "Docker repository for p2p-gear-rental"
  format        = "DOCKER"
}
