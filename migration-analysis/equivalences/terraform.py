TERRAFORM_NORMALIZATION_EQUIVALENCES = {

    # ==========================================================
    # STORAGE
    # AWS S3 <-> Google Cloud Storage
    # ==========================================================
    "infra/storage.tf": {

        # Recurso principal de Object Storage
        'resource "aws_s3_bucket" "frontend" {':
            'resource "google_storage_bucket" "frontend" {',

        # Nome do bucket
        "bucket        = var.frontend_bucket_name":
            "name                        = var.frontend_bucket_name",

        # Documento inicial do website
        'suffix = "index.html"':
            'main_page_suffix = "index.html"',

        # Documento de fallback do website
        'key = "index.html"':
            'not_found_page   = "index.html"',
    },


    # ==========================================================
    # API GATEWAY
    # AWS API Gateway <-> Google API Gateway
    # ==========================================================
    "infra/api_gateway.tf": {

        # Variável entregue ao template OpenAPI
        "lambda_invoke_arn = data.aws_lambda_function.api.invoke_arn":
            "cloud_function_url = var.cloud_function_url",

        # API Config / Deployment associado à API
        "rest_api_id = aws_api_gateway_rest_api.todolist.id":
            "api           = google_api_gateway_api.todolist.api_id",

        # Configuração publicada pelo Stage/Gateway
        "deployment_id = aws_api_gateway_deployment.todolist.id":
            "api_config = google_api_gateway_api_config.todolist.id",

        # Referência usada para preencher o OpenAPI
        "lambda_invoke_arn":
            "cloud_function_url",

        # Definição principal da API
        'resource "aws_api_gateway_rest_api" "todolist" {':
            'resource "google_api_gateway_api" "todolist" {',

        # Deployment/configuração da API
        'resource "aws_api_gateway_deployment" "todolist" {':
            'resource "google_api_gateway_api_config" "todolist" {',

        # Stage/Gateway publicado
        'resource "aws_api_gateway_stage" "todolist" {':
            'resource "google_api_gateway_gateway" "todolist" {',

        # Referência à API principal
        "aws_api_gateway_rest_api.todolist":
            "google_api_gateway_api.todolist",

        # Referência ao deployment/config
        "aws_api_gateway_deployment.todolist":
            "google_api_gateway_api_config.todolist",

        # Referência ao endpoint publicado
        "aws_api_gateway_stage.todolist":
            "google_api_gateway_gateway.todolist",
    },


    # ==========================================================
    # IAM
    # ==========================================================
    "infra/iam.tf": {

        # Referência ao bucket sobre o qual a permissão é aplicada
        "aws_s3_bucket.frontend.id":
            "google_storage_bucket.frontend.name",
    },


    # ==========================================================
    # OUTPUTS
    # ==========================================================
    "infra/outputs.tf": {

        "aws_s3_bucket.frontend.id":
            "google_storage_bucket.frontend.name",

        'value = "https://${aws_api_gateway_rest_api.todolist.id}.execute-api.${var.region}.amazonaws.com/${aws_api_gateway_stage.todolist.stage_name}"':
            'value = "https://${google_api_gateway_gateway.todolist.default_hostname}"',

        'value = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"':
            'value = "https://storage.googleapis.com/${google_storage_bucket.frontend.name}/index.html"',
    },


    # ==========================================================
    # PROVIDERS
    # AWS Provider <-> Google Provider
    # ==========================================================
    "infra/providers.tf": {

        # Entrada do required_providers
        "aws = {":
            "google = {",

        # Source do provider
        '"hashicorp/aws"':
            '"hashicorp/google"',

        # Bloco provider
        'provider "aws"':
            'provider "google"',
    },


    # ==========================================================
    # VARIABLES
    # ==========================================================
    "infra/variables.tf": {

        # Nome da função serverless
        'variable "lambda_function_name"':
            'variable "function_name"',

        # Região default específica do provider.
        '"us-east-1"':
            '"us-central1"',
    },
}