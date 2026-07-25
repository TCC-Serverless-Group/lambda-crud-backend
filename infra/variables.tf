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

variable "api_id" {
  type    = string
  default = "todolist-api"
}

variable "gateway_id" {
  type    = string
  default = "todolist-gateway"
}

variable "function_name" {
  type    = string
  default = "todolist-dev-api"
}