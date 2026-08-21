TERRAFORM_ARCHITECTURAL_EQUIVALENCES = {

    "storage": {

        "object_storage": {
            "aws": [
                "aws_s3_bucket",
            ],
            "gcp": [
                "google_storage_bucket",
            ],
            "strength": "strong",
        },

        "static_website": {
            "aws": [
                "aws_s3_bucket_website_configuration",
            ],
            "gcp": [
                "google_storage_bucket.website",
            ],
            "strength": "functional",
        },

        "public_object_read": {
            "aws": [
                "aws_s3_bucket_public_access_block",
                "aws_s3_bucket_policy",
            ],
            "gcp": [
                "google_storage_bucket_iam_member",
            ],
            "strength": "functional",
        },
    },

    "api_gateway": {

        "api_definition": {
            "aws": [
                "aws_api_gateway_rest_api",
            ],
            "gcp": [
                "google_api_gateway_api",
            ],
            "strength": "strong",
        },

        "api_configuration": {
            "aws": [
                "aws_api_gateway_deployment",
            ],
            "gcp": [
                "google_api_gateway_api_config",
            ],
            "strength": "strong",
        },

        "api_endpoint": {
            "aws": [
                "aws_api_gateway_stage",
            ],
            "gcp": [
                "google_api_gateway_gateway",
            ],
            "strength": "strong",
        },
    },

    "iam": {

        "function_invocation": {
            "aws": [
                "aws_lambda_permission",
            ],
            "gcp": [
                "google_cloudfunctions_function_iam_member",
            ],
            "strength": "partial",
            "reason": (
                "AWS restringe a invocação ao API Gateway, "
                "enquanto a implementação GCP atual usa allUsers."
            ),
        },
    },

    "provider_specific": {

        "aws_function_lookup": {
            "aws": [
                "data.aws_lambda_function",
            ],
            "gcp": [],
            "strength": "source_only",
        },

        "gcp_api_enablement": {
            "aws": [],
            "gcp": [
                "google_project_service",
            ],
            "strength": "target_only",
        },
    },
}