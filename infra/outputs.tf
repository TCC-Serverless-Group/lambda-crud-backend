output "frontend_bucket_name" {
  value = google_storage_bucket.frontend.name
}

output "api_url" {
  value = "https://${google_api_gateway_gateway.todolist.default_hostname}"
}

output "frontend_url" {
  value = "https://storage.googleapis.com/${google_storage_bucket.frontend.name}/index.html"
}