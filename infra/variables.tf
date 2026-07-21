variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "frontend_bucket_name" {
  type = string
}

variable "cloud_function_url" {
  type = string
}