data "aws_iam_policy_document" "frontend_bucket" {
  statement {
    sid    = "PublicReadGetObject"
    effect = "Allow"

    actions = [
      "s3:GetObject"
    ]

    resources = [
      "${aws_s3_bucket.frontend.arn}/*"
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend_bucket.json

  depends_on = [
    aws_s3_bucket_public_access_block.frontend
  ]
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = data.aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.todolist.execution_arn}/*"
}