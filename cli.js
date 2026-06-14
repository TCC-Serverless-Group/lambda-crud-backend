#!/usr/bin/env node

import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation"
import dotenv from "dotenv";

dotenv.config();

const config = {
  region: process.env.AWS_REGION || "sa-east-1",
  stackName: process.env.AWS_STACK_NAME || "todolist-dev",
}

// verificando configurações obrigatórias
if (!config.region || !config.stackName) {
  console.error(`Propriedade region: ${config.region}`)
  console.error(`Propriedade stackname: ${config.stackName}`)
  console.error(" Variáveis obrigatórias não definidas no .env")
  process.exit(1)
}

const cloudformation = new CloudFormationClient({ region: config.region })

async function getStackOutputs() {

 const response = await cloudformation.send(
    new DescribeStacksCommand({ StackName: config.stackName })
  )

  const outputsArray = response.Stacks?.[0]?.Outputs || []

  let outputs = {}
  for (const item of outputsArray) {
    outputs[item.OutputKey] = item.OutputValue
  }

  return outputs
}

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

function ensureFrontendEnv(apiUrl) {
  const envFrontendContent = readEnvFile()
  console.log(`### conteúdo do .env:
     REACT_APP_API_URL=${apiUrl}\n
     REACT_APP_SUPABASE_URL=${envFrontendContent[0]}\n
     REACT_APP_SUPABASE_ANON_KEY=${envFrontendContent[1]}\n`)

  fs.writeFileSync(
    "frontend/.env",
    `REACT_APP_API_BASE_URL=${apiUrl}\nREACT_APP_SUPABASE_URL=${envFrontendContent[0]}\nREACT_APP_SUPABASE_ANON_KEY=${envFrontendContent[1]}\n`
  )
}

function readEnvFile() {
  const envValues = fs.readFileSync("frontend/.env", 'utf8')
  .split("\n")
  .filter(line => line.startsWith("REACT_APP_SUPABASE_"))
  .map(line => line.split("=")[1])
  console.log(`### valores encontrados: ${envValues[0]} e ${envValues[1]} ###`)
  return envValues;
}

async function backend() {
  run(`cd backend && npm install`)
  run("cd backend && npx serverless deploy")

  const outputs = await getStackOutputs()

  console.log("API URL:", outputs.ApiUrl)

  return outputs;
}

// DEPLOY COMPLETO
async function backAndFront() {
 
  console.log("### iniciando deploy do backend ###")
  const outputs = await backend()

  const apiUrl = outputs.ApiUrl;
  ensureFrontendEnv(apiUrl)
  const distributionId = outputs.CloudFrontDistributionId;
  const bucketName = outputs.SpaBucketName;

  console.log(`### Obtendo variáveis para frontend ###`)
  console.log(`### apiUrl: ${apiUrl} ###`)
  console.log(`### distributionId: ${distributionId} ###`)
  console.log(`### bucketName: ${bucketName} ###`)
  console.log("### iniciando deploy do frontend ###")

  console.log(`\n Enviando build para bucket: ${bucketName}`)
  run(`cd frontend && npm install && npm run build && aws s3 sync build/ s3://${bucketName} --delete`)

  console.log("\n Deploy completo! Acessar a URL do CloudFront para ver a aplicação.")
  console.log(`URL do CloudFront: ${outputs.CloudFrontUrl}`)
  console.log("### invalidando distribuição CloudFront anterior ###")
  run(
  `cd frontend && aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "/*"`
  )
}

// REMOVE COMPLETO (idempotente)
async function remove() {
  const outputs = await getStackOutputs()
  console.log("\n Esvaziando bucket...")
  safeRun(`aws s3 rm s3://${outputs.SpaBucketName} --recursive`)
  console.log("\n Removendo stack completa...")
  safeRun(`cd backend && npx serverless remove`)
}

// LIMPEZA LOCAL
function cls() {
  console.log("\n Limpando artefatos de build...")

  removeDir(path.resolve("backend/.serverless/"))
  removeDir(path.resolve("backend/node_modules/"))
  removeDir(path.resolve("backend/dist/"))
  removeDir(path.resolve("backend/.webpack"))
  removeDir(path.resolve("frontend/node_modules/"))
  removeDir(path.resolve("frontend/build"))
  removeDir(path.resolve("frontend/dist"))

  console.log("\n Build limpo com sucesso.")
}

switch (command) {
  case "deploy":
    try {
      backAndFront()
    } catch (err) {
      console.error("Erro durante o deploy:", err)
      process.exit(1)
    }
    break
  case "remove":
    remove()
    break
  case "cls":
    cls()
    break
  default:
    console.log(`
    Comandos disponíveis:

    node cli deploy
    node cli remove
    node cli cls
    `)
}