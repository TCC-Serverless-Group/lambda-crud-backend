#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

function run(cmd) {
  console.log(`\n${cmd}`);
  execSync(cmd, { stdio: "inherit", shell: true });
}

function output(cmd) {
  return execSync(cmd, { encoding: "utf-8", shell: true }).trim();
}

function safeRun(cmd) {
  try {
    run(cmd);
  } catch {
    console.log("Ignorando erro.");
  }
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Removido: ${dir}`);
  }
}

const config = {
  projectId: process.env.GCP_PROJECT_ID,
  region: process.env.GCP_REGION || "us-central1",
  bucket: process.env.FRONTEND_BUCKET,
  functionName: process.env.GCP_FUNCTION_NAME || "todolist-dev-api",
};

if (!config.projectId || !config.bucket) {
  console.error("Variáveis obrigatórias não definidas no .env");
  process.exit(1);
}

function backendDeploy() {
  run("cd backend && npm install && npx serverless deploy");
}

function backendRemove() {
  safeRun("cd backend && npx serverless remove");
}

function getCloudFunctionUrl() {
  return output(
    `gcloud functions describe todolist-dev-api ` +
    `--region=${config.region} ` +
    `--project=${config.projectId} ` +
    `--format="value(httpsTrigger.url)"`
  );
}

function tofuApply() {
  const functionUrl = getCloudFunctionUrl();

  run(
    `cd infra && tofu init && tofu apply -auto-approve ` +
    `-var="project_id=${config.projectId}" ` +
    `-var="region=${config.region}" ` +
    `-var="frontend_bucket_name=${config.bucket}" ` +
    `-var="cloud_function_url=${functionUrl}"`+
    `-var="function_name=${config.functionName}"`
  );
}

function tofuDestroy() {
  safeRun(
    `cd infra && tofu destroy -auto-approve ` +
    `-var="project_id=${config.projectId}" ` +
    `-var="region=${config.region}" ` +
    `-var="frontend_bucket_name=${config.bucket}" ` +
    `-var="cloud_function_url=dummy"`
  );
}

function tofuOutput(name) {
  return output(`cd infra && tofu output -raw ${name}`);
}

function ensureFrontendEnv(apiUrl) {
  const envPath = path.resolve("frontend", ".env");

  const content = [
    `REACT_APP_API_BASE_URL=${apiUrl}`,
    `REACT_APP_SUPABASE_URL=${process.env.REACT_APP_SUPABASE_URL ?? ""}`,
    `REACT_APP_SUPABASE_ANON_KEY=${process.env.REACT_APP_SUPABASE_ANON_KEY ?? ""}`,
  ].join("\n");

  fs.writeFileSync(envPath, content);
}

function frontendDeploy() {
  const apiUrl = tofuOutput("api_url");
  const bucketName = tofuOutput("frontend_bucket_name");

  ensureFrontendEnv(apiUrl);

  run("cd frontend && npm install");
  run("cd frontend && npm run build");
  run(`gcloud storage rsync frontend/build gs://${bucketName} --recursive --delete-unmatched-destination-objects`);

  console.log(`Frontend publicado no bucket: ${bucketName}`);
  console.log(`API Gateway URL: ${apiUrl}`);
}

async function deploy() {
  backendDeploy();
  tofuApply();
  frontendDeploy();

  console.log("\nProjeto implantado com sucesso.");
}

async function remove() {
  tofuDestroy();
  backendRemove();

  console.log("\nRecursos removidos.");
}

function cls() {
  removeDir(path.resolve("backend/.serverless"));
  removeDir(path.resolve("backend/dist"));
  removeDir(path.resolve("backend/node_modules"));
  removeDir(path.resolve("frontend/build"));
  removeDir(path.resolve("frontend/dist"));

  console.log("\nBuild limpo com sucesso.");
}

const command = process.argv[2] || "help";

switch (command) {
  case "deploy":
    await deploy();
    break;

  case "remove":
    await remove();
    break;

  case "cls":
    cls();
    break;

  default:
    console.log(`
Comandos disponíveis:

  node cli.js deploy
  node cli.js remove
  node cli.js cls
`);
}