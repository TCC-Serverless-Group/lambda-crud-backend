CLOUD_RESOURCE_EQUIVALENCES = {

    # ==========================================================
    # TERRAFORM - RECURSOS DE INFRAESTRUTURA
    # ==========================================================
    "terraform": {

        # Object Storage
        "aws_s3_bucket":
            "google_storage_bucket",

        # API Gateway - API principal
        "aws_api_gateway_rest_api":
            "google_api_gateway_api",

        # API Gateway - configuração/deployment da API
        "aws_api_gateway_deployment":
            "google_api_gateway_api_config",

        # API Gateway - instância exposta/stage
        "aws_api_gateway_stage":
            "google_api_gateway_gateway",
    },


    # ==========================================================
    # TERRAFORM - REFERÊNCIAS / VARIÁVEIS
    # ==========================================================
    "terraform_variables": {

        # Nome da função serverless
        "lambda_function_name":
            "function_name",

        # Referência ao backend usada na especificação OpenAPI
        "lambda_invoke_arn":
            "cloud_function_url",
    },


    # ==========================================================
    # TERRAFORM - PROVIDERS
    # ==========================================================
    "terraform_provider": {

        'provider "aws"':
            'provider "google"',

        'hashicorp/aws':
            'hashicorp/google',
    },


    # ==========================================================
    # OPENAPI
    # ==========================================================
    "openapi": {

        # Extensão que conecta o gateway ao backend
        "x-amazon-apigateway-integration":
            "x-google-backend",

        # Backend da API
        "${lambda_invoke_arn}":
            "${cloud_function_url}",
    },


    # ==========================================================
    # SERVERLESS FRAMEWORK
    # ==========================================================
    "serverless": {

        # Provider Serverless
        "name: aws":
            "name: google",

        # Runtime equivalente
        "nodejs20.x":
            "nodejs20",
    },


    # ==========================================================
    # VARIÁVEIS DE AMBIENTE
    # ==========================================================
    "environment": {

        "AWS_REGION":
            "GCP_REGION",

        "AWS_FUNCTION_NAME":
            "GCP_FUNCTION_NAME",
    },


    # ==========================================================
    # STORAGE / CLI
    # ==========================================================
    "storage": {

        # URI de Object Storage
        "s3://":
            "gs://",
    },
}