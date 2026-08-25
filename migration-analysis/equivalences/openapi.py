OPENAPI_NORMALIZATION_EQUIVALENCES = {
    "lambda_invoke_arn": "cloud_function_url",
}

OPENAPI_ARCHITECTURAL_EQUIVALENCES = {

    "backend_integration": {
        "aws": [
            "x-amazon-apigateway-integration",
        ],
        "gcp": [
            "x-google-backend",
        ],
        "strength": "functional",
        "cardinality": "many_to_one",
    },

    "backend_reference": {
        "aws": [
            "lambda_invoke_arn",
        ],
        "gcp": [
            "cloud_function_url",
        ],
        "strength": "functional",
    },

    "cors": {
        "aws": [
            "x-amazon-apigateway-gateway-responses",
            "options",
        ],
        "gcp": [
            "allowCors",
            "options",
        ],
        "strength": "partial",
    },
}