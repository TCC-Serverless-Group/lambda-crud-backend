#!/usr/bin/env node

import { execSync } from "child_process"
import fs from "fs"
import path from "path"

function run(cmd) {
  console.log(`\n ${cmd}`)
  execSync(cmd, { stdio: "inherit", shell: true })
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
    console.log(`🗑️  Removido: ${dir}`)
  }
}

const command = process.argv[2] || "help"

// Configuração
const config = {
  projectId: process.env.GCP_PROJECT_ID || "projeto-gcp-id",
  region: process.env.GCP_REGION || "us-central1",
  bucket: process.env.FRONTEND_BUCKET || "bucket-frontend",
}

// verificando configurações obrigatórias
if (!config.projectId || !config.bucket) {
  console.error(`Propriedade projectId: ${config.projectId}`)
  console.error(`Propriedade bucket: ${config.bucket}`)
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

// Função para remover os recursos do projeto
function remove() {
 console.log("\n Removendo backend (Serverless)...")
  safeRun(`cd backend && npx serverless remove`)

  console.log("\n  Removendo bucket (se existir)...")
  safeRun(`gsutil rm -r gs://${config.bucket}`)

  console.log("\n Limpando configurações locais...")
  safeRun(`gcloud config unset project`)
}
// Função para executar comandos de forma segura, ignorando erros
function purge() {
  console.log("\n Removendo projeto (Serverless)...")
  safeRun(`gsutil ls -b gs://${config.bucket} && gsutil rm -r gs://${config.bucket}`)
}
// Função para executar realizar limpeza de artefatos de build
function cls() {
  console.log("\n🧹 Limpando artefatos de build...")

  removeDir(path.resolve("backend/.serverless"))
  removeDir(path.resolve("backend/dist"))
  removeDir(path.resolve("backend/.webpack"))
  removeDir(path.resolve("frontend/build"))
  removeDir(path.resolve("frontend/dist"))

  console.log("\n✅ Build limpo com sucesso.")
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
  case "remove":
    remove()
    break
  case "purge":
    purge()
    break
  case "cls":
    cls()
    break
  default:
    console.log(`
    Comandos disponíveis:

    node cli infra
    node cli frontend
    node cli backend
    node cli deploy
    node cli remove
    node cli purge
    node cli cls
    `)
}
