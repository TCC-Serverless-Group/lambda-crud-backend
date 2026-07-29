variable "region" {
  type    = string
  default = "us-east-1"
}

variable "stage" {
  type    = string
  default = "dev"
}

variable "service_name" {
  type    = string
  default = "todolist"
}

variable "frontend_bucket_name" {
  type = string
}

variable "lambda_function_name" {
  type    = string
  default = "todolist-dev-api"
}