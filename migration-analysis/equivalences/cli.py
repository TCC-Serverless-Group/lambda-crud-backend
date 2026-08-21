CLI_NORMALIZATION_EQUIVALENCES = {

    "s3://":
        "gs://",
}

CLI_ARCHITECTURAL_EQUIVALENCES = {

    "backend_deploy": {
        "aws": "serverless deploy",
        "gcp": "serverless deploy",
        "strength": "strong",
    },

    "backend_remove": {
        "aws": "serverless remove",
        "gcp": "serverless remove",
        "strength": "strong",
    },

    "infra_apply": {
        "aws": "tofu apply",
        "gcp": "tofu apply",
        "strength": "strong",
    },

    "infra_destroy": {
        "aws": "tofu destroy",
        "gcp": "tofu destroy",
        "strength": "strong",
    },

    "frontend_build": {
        "aws": "npm run build",
        "gcp": "npm run build",
        "strength": "strong",
    },

    "frontend_upload": {
        "aws": "aws s3 sync",
        "gcp": "gcloud storage rsync",
        "strength": "functional",
    },

    "object_storage_uri": {
        "aws": "s3://",
        "gcp": "gs://",
        "strength": "strong",
    },
}