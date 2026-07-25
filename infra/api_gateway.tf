locals {
  openapi_content = templatefile("${path.module}/openapi.yaml", {
    cloud_function_url = var.cloud_function_url
  })
}

resource "google_api_gateway_api" "todolist" {
  provider = google-beta
  api_id = var.api_id

  depends_on = [
    google_project_service.api_gateway
  ]
}

resource "google_api_gateway_api_config" "todolist" {
  provider = google-beta
  api           = google_api_gateway_api.todolist.api_id
  api_config_id = "${var.api_id}-config"

  openapi_documents {
    document {
      path     = "openapi.yaml"
      contents = base64encode(local.openapi_content)
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    google_project_service.service_management,
    google_project_service.service_control
  ]
}

resource "google_api_gateway_gateway" "todolist" {
  provider = google-beta
  gateway_id = var.gateway_id
  api_config = google_api_gateway_api_config.todolist.id
  region     = var.region
}