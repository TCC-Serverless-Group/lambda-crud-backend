#!/usr/bin/env node

import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import dotenv from "dotenv";

dotenv.config();

function run(cmd) {
  console.log(`\n ${cmd}`)
  execSync(cmd, { stdio: "inherit", shell: true })
}

function safeRun(cmd) {
  try {
    run(cmd)
  } catch {
    console.log(" Ignorando erro (provavelmente recurso inexistente)")
  }
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
    console.log(` Removido: ${dir}`)
  }
}

const command = process.argv[2] || "help"

// Configuração
const config = {
  projectId: process.env.GCP_PROJECT_ID,
  region: process.env.GCP_REGION || "us-central1",
  bucket: process.env.FRONTEND_BUCKET,
}

// verificando configurações obrigatórias
if (!config.projectId || !config.bucket) {
  console.error(`Propriedade projectId: ${config.projectId}`)
  console.error(`Propriedade bucket: ${config.bucket}`)
  console.error(" Variáveis obrigatórias não definidas no .env")
  process.exit(1)
}

// Função para configurar a infraestrutura
async function infra() {
  run(`gcloud config set project ${config.projectId}`)
  run(`gcloud services enable cloudfunctions.googleapis.com run.googleapis.com compute.googleapis.com cloudbuild.googleapis.com`)
  run(`gsutil mb -l ${config.region} gs://${config.bucket} || echo bucket exists`)
  run(`gsutil web set -m index.html -e index.html gs://${config.bucket}`)
  run(`gsutil iam ch allUsers:objectViewer gs://${config.bucket}`)
}

// Função para construir e implantar o frontend
async function frontend() {
  console.log("\n executou a install do frontend")
  run(`cd frontend && npm install`)
  console.log("\n executou o build do frontend")
  run(`cd frontend && npm run build`)
  console.log("\n executou o upload do frontend")
  run(`gcloud storage rsync frontend/build gs://${config.bucket} --recursive --delete-unmatched-destination-objects`)
  
}

// Função para implantar o backend
async function backend() {
  run(`cd backend && npm install && npx serverless deploy`)
}

// Função para remover os recursos do projeto
async function remove() {
 console.log("\n Removendo backend (Serverless)...")
  safeRun(`cd backend && npx serverless remove`)

  console.log("\n  Removendo bucket (se existir)...")
  safeRun(`gsutil -m rm -r gs://${config.bucket}`)
}

// Função para executar realizar limpeza de artefatos de build
function cls() {
  console.log("\n🧹 Limpando artefatos de build...")

  removeDir(path.resolve("backend/.serverless"))
  removeDir(path.resolve("backend/dist"))
  removeDir(path.resolve("backend/.webpack"))
  removeDir(path.resolve("frontend/build"))
  removeDir(path.resolve("frontend/dist"))

  console.log("\n Build limpo com sucesso.")
}

// Função para executar realizar limpeza de bucket temporário
function purge() {
  safeRun(`gsutil rm -r gs://gcf-sources-167143243284-us-central1`)
}

switch (command) {
  case "infra":
    await infra()
    break
  case "frontend":
    await frontend()
    break
  case "backend":
    await backend()
    break
  case "deploy":
    try {
      await infra()
      await backend()
      await frontend()
      console.log("\n Projeto implantado com sucesso!")
    } catch (err) {
      console.error("Erro durante o deploy:", err)
      process.exit(1)
    }
    break
  case "remove":
    await remove()
    break
  case "purge":
    await purge()
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
