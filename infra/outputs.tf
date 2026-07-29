output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend.id
}

output "api_url" {
  value = "https://${aws_api_gateway_rest_api.todolist.id}.execute-api.${var.region}.amazonaws.com/${aws_api_gateway_stage.todolist.stage_name}"
}

output "frontend_url" {
  value = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}