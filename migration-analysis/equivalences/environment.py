# ==========================================================
# V2 - NORMALIZAÇÃO
# Deve ser sempre str -> str
# ==========================================================

ENVIRONMENT_NORMALIZATION_EQUIVALENCES = {
    "AWS_REGION": "GCP_REGION",
    "AWS_FUNCTION_NAME": "GCP_FUNCTION_NAME",
}


# ==========================================================
# V3 - EQUIVALÊNCIA ARQUITETURAL
# Não é usado por normalize_cloud_lines()
# ==========================================================

ENVIRONMENT_ARCHITECTURAL_EQUIVALENCES = {

    "region": {
        "aws": "AWS_REGION",
        "gcp": "GCP_REGION",
        "strength": "strong",
    },

    "function_name": {
        "aws": "AWS_FUNCTION_NAME",
        "gcp": "GCP_FUNCTION_NAME",
        "strength": "strong",
    },
}