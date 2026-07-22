resource "google_storage_bucket" "frontend" {
  name                        = var.frontend_bucket_name
  location                    = "US"
  uniform_bucket_level_access = true
  force_destroy               = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }

  depends_on = [
    google_project_service.storage
  ]
}