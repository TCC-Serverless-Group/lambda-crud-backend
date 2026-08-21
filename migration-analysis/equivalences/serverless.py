SERVERLESS_ARCHITECTURAL_EQUIVALENCES = {

    "provider": {
        "aws": "aws",
        "gcp": "google",
        "strength": "provider_substitution",
    },

    "runtime": {
        "aws": "nodejs20.x",
        "gcp": "nodejs20",
        "strength": "strong",
    },

    "function_handler": {
        "aws": "index.handler",
        "gcp": "handler",
        "strength": "functional",
    },

    "function_deployment": {
        "aws": "serverless",
        "gcp": "serverless-google-cloudfunctions",
        "strength": "functional",
    },
}