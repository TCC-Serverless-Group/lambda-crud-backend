locals {
  openapi_content = templatefile("${path.module}/openapi.yaml", {
    lambda_invoke_arn = data.aws_lambda_function.api.invoke_arn
  })
}

resource "aws_api_gateway_rest_api" "todolist" {
  name        = "${var.service_name}-${var.stage}-api"
  description = "API da aplicação TodoList"

  body = local.openapi_content

  put_rest_api_mode = "overwrite"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Application = var.service_name
    Stage       = var.stage
    ManagedBy   = "OpenTofu"
  }
}

resource "aws_api_gateway_deployment" "todolist" {
  rest_api_id = aws_api_gateway_rest_api.todolist.id

  triggers = {
    redeployment = sha1(local.openapi_content)
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_lambda_permission.api_gateway
  ]
}

resource "aws_api_gateway_stage" "todolist" {
  rest_api_id   = aws_api_gateway_rest_api.todolist.id
  deployment_id = aws_api_gateway_deployment.todolist.id
  stage_name    = var.stage

  tags = {
    Application = var.service_name
    Stage       = var.stage
    ManagedBy   = "OpenTofu"
  }
}