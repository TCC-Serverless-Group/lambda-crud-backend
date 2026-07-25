resource "google_storage_bucket_iam_member" "frontend_public_read" {
  bucket = google_storage_bucket.frontend.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_cloudfunctions_function_iam_member" "function_public_invoker" {
  project        = var.project_id
  region         = var.region
  cloud_function = var.function_name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}