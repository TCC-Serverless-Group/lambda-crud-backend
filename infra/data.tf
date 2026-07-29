data "aws_lambda_function" "api" {
  function_name = var.lambda_function_name
}