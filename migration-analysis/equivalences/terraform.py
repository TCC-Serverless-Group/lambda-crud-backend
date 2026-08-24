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
    # Somente normalizações suficientemente fortes.
    #
    # Não normalizamos aws_lambda_permission <->
    # google_cloudfunctions_function_iam_member aqui porque
    # a política de segurança das implementações é diferente.
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

        # Nome/identificador do bucket exposto como output
        "aws_s3_bucket.frontend.id":
            "google_storage_bucket.frontend.name",
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
        #
        # Como esta regra só é aplicada a variables.tf,
        # não afeta outras ocorrências dessas regiões.
        '"us-east-1"':
            '"us-central1"',
    },


    # ==========================================================
    # DATA
    #
    # Existe na AWS, mas não há infra/data.tf correspondente
    # na branch GCP atual.
    #
    # Mantido explícito apenas para documentar a situação.
    # O compare.py atual não chegará a utilizá-lo porque trabalha
    # somente com arquivos compartilhados.
    # ==========================================================
    "infra/data.tf": {},


    # ==========================================================
    # GCP APIS
    #
    # Existe somente na branch GCP.
    # Não possui arquivo de mesmo caminho na AWS.
    # ==========================================================
    "infra/apis.tf": {},
}