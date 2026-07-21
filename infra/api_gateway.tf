locals {
  openapi_content = templatefile("${path.module}/openapi.yaml", {
    cloud_function_url = var.cloud_function_url
  })
}

resource "google_api_gateway_api" "todolist" {
  provider = google
  api_id   = "todolist-api"

  depends_on = [
    google_project_service.api_gateway
  ]
}

resource "google_api_gateway_api_config" "todolist" {
  provider      = google
  api           = google_api_gateway_api.todolist.api_id
  api_config_id = "todolist-config"

  openapi_documents {
    document {
      path     = "openapi.yaml"
      contents = base64encode(local.openapi_content)
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_api_gateway_gateway" "todolist" {
  provider   = google
  gateway_id = "todolist-gateway"
  api_config = google_api_gateway_api_config.todolist.id
  region     = var.region
}