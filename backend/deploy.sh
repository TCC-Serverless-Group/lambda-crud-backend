#!/usr/bin/env bash
set -e

PROJECT_ID=my-gcp-project-id

export GCP_PROJECT_ID=$PROJECT_ID
export SUPABASE_URL=...
export SUPABASE_ANON_KEY=...
export SUPABASE_JWT_SECRET=...

echo "🚀 Deploy Frontend + Backend"

# 1. Infra
./infra/gcp.sh $PROJECT_ID

# 2. Frontend
cd frontend
npm install
npm run build
gsutil -m rsync -r build gs://todolist-dev-frontend
cd ..

# 3. Backend
npm install
serverless deploy
cd ..

echo "✅ Deploy completo"
