#!/usr/bin/env node

import { execSync } from "child_process"

function run(cmd) {
  console.log(`\n ${cmd}`)
  execSync(cmd, { stdio: "inherit", shell: true })
}

const command = process.argv[2] || "help"

// Configuração
const config = {
  projectId: process.env.GCP_PROJECT_ID,
  region: process.env.GCP_REGION || "us-central1",
  bucket: process.env.FRONTEND_BUCKET
}

// verificando configurações obrigatórias
if (!config.projectId || !config.bucket) {
  console.error(" Variáveis obrigatórias não definidas no .env")
  process.exit(1)
}

// Função para configurar a infraestrutura
function infra() {
  run(`gcloud config set project ${config.projectId}`)
  run(`gcloud services enable cloudfunctions.googleapis.com run.googleapis.com compute.googleapis.com cloudbuild.googleapis.com`)
  run(`gsutil mb -l ${config.region} gs://${config.bucket} || echo bucket exists`)
  run(`gsutil web set -m index.html -e index.html gs://${config.bucket}`)
  run(`gsutil iam ch allUsers:objectViewer gs://${config.bucket}`)
}

// Função para construir e implantar o frontend
function frontend() {
  run(`cd frontend && npm install`)
  run(`cd frontend && npm run build`)
  run(`gsutil -m rsync -r frontend/build gs://${config.bucket}`)
}

// Função para implantar o backend
function backend() {
  run(`cd backend && npm install`)
  run(`cd backend && npx serverless deploy`)
}

switch (command) {
  case "infra":
    infra()
    break
  case "frontend":
    frontend()
    break
  case "backend":
    backend()
    break
  case "deploy":
    infra()
    frontend()
    backend()
    break
  default:
    console.log(`
Comandos disponíveis:

node cli infra
node cli frontend
node cli backend
node cli deploy
`)
}
