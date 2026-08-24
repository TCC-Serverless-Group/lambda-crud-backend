# ==========================================================
# V2 - NORMALIZAÇÃO TEXTUAL
#
# Usado diretamente por normalize_cloud_lines().
# Obrigatoriamente deve ser:
#
#     str -> str
#
# ==========================================================

SERVERLESS_NORMALIZATION_EQUIVALENCES = {

    # Provider
    "name: aws":
        "name: google",

    # Runtime Node.js
    "runtime: nodejs20.x":
        "runtime: nodejs20",

    # Handler da função
    "handler: index.handler":
        "handler: handler",
}


# ==========================================================
# V3 - EQUIVALÊNCIA ARQUITETURAL
#
# NÃO deve ser passado para normalize_cloud_lines().
# Será utilizado futuramente por um analisador arquitetural.
# ==========================================================

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

    "deployment_framework": {
        "aws": "serverless",
        "gcp": "serverless",
        "strength": "strong",
    },

    "gcp_provider_plugin": {
        "aws": None,
        "gcp": "serverless-google-cloudfunctions",
        "strength": "target_only",
    },
}