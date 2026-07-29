#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const ROOT_DIR = process.cwd();
const BACKEND_DIR = path.resolve(ROOT_DIR, "backend");
const FRONTEND_DIR = path.resolve(ROOT_DIR, "frontend");
const INFRA_DIR = path.resolve(ROOT_DIR, "infra");

dotenv.config({
  path: path.resolve(ROOT_DIR, ".env"),
});

const serviceName = process.env.AWS_SERVICE_NAME || "todolist";
const stage = process.env.AWS_STAGE || "dev";

const config = Object.freeze({
  region: process.env.AWS_REGION || "us-east-1",
  stage,
  serviceName,

  bucket: process.env.FRONTEND_BUCKET,

  functionName:
    process.env.AWS_FUNCTION_NAME ||
    `${serviceName}-${stage}-api`,

  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
});

function formatCommand(command, args) {
  return [command, ...args]
    .map((value) => {
      const text = String(value);

      return text.includes(" ")
        ? `"${text}"`
        : text;
    })
    .join(" ");
}

function run(command, args = [], cwd = ROOT_DIR) {
  console.log(`\n$ ${formatCommand(command, args)}`);

  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
}

function output(command, args = [], cwd = ROOT_DIR) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf-8",
    env: process.env,
  }).trim();
}

function removeDir(directory) {
  if (!fs.existsSync(directory)) {
    return;
  }

  fs.rmSync(directory, {
    recursive: true,
    force: true,
  });

  console.log(`Removido: ${directory}`);
}

function validateConfig() {
  const requiredVariables = {
    FRONTEND_BUCKET: config.bucket,
    DATABASE_URL: config.databaseUrl,
    SUPABASE_URL: config.supabaseUrl,
    SUPABASE_ANON_KEY: config.supabaseAnonKey,
    SUPABASE_JWT_SECRET: config.supabaseJwtSecret,
  };

  const missingVariables = Object.entries(requiredVariables)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingVariables.length > 0) {
    throw new Error(
      `Variáveis obrigatórias não definidas: ${missingVariables.join(", ")}`
    );
  }
}

function checkAwsCredentials() {
  const accountId = output("aws", [
    "sts",
    "get-caller-identity",
    "--query",
    "Account",
    "--output",
    "text",
    "--region",
    config.region,
  ]);

  console.log(`Conta AWS autenticada: ${accountId}`);
  console.log(`Região: ${config.region}`);
  console.log(`Stage: ${config.stage}`);
}

function backendDeploy() {
  console.log("\n### Implantando Lambda com Serverless ###");

  run("npm", ["install"], BACKEND_DIR);

  run(
    "npx",
    [
      "serverless",
      "deploy",
      "--stage",
      config.stage,
      "--region",
      config.region,
    ],
    BACKEND_DIR
  );
}

function backendRemove() {
  console.log("\n### Removendo Lambda com Serverless ###");

  run(
    "npx",
    [
      "serverless",
      "remove",
      "--stage",
      config.stage,
      "--region",
      config.region,
    ],
    BACKEND_DIR
  );
}

function tofuVariables() {
  return [
    `-var=region=${config.region}`,
    `-var=stage=${config.stage}`,
    `-var=service_name=${config.serviceName}`,
    `-var=frontend_bucket_name=${config.bucket}`,
    `-var=lambda_function_name=${config.functionName}`,
  ];
}

function tofuInit() {
  console.log("\n### Inicializando OpenTofu ###");

  run("tofu", ["init"], INFRA_DIR);
}

function tofuApply() {
  console.log("\n### Implantando infraestrutura AWS ###");

  tofuInit();

  run(
    "tofu",
    [
      "apply",
      "-auto-approve",
      ...tofuVariables(),
    ],
    INFRA_DIR
  );
}

function tofuDestroy() {
  console.log("\n### Removendo infraestrutura AWS ###");

  tofuInit();

  run(
    "tofu",
    [
      "destroy",
      "-auto-approve",
      ...tofuVariables(),
    ],
    INFRA_DIR
  );
}

function tofuOutput(name) {
  return output(
    "tofu",
    ["output", "-raw", name],
    INFRA_DIR
  );
}

function ensureFrontendEnv(apiUrl) {
  const envPath = path.resolve(FRONTEND_DIR, ".env");

  const content = [
    `REACT_APP_API_BASE_URL=${apiUrl}`,
    `REACT_APP_SUPABASE_URL=${config.supabaseUrl}`,
    `REACT_APP_SUPABASE_ANON_KEY=${config.supabaseAnonKey}`,
    "",
  ].join("\n");

  fs.writeFileSync(envPath, content, "utf-8");

  console.log(`Frontend configurado com API: ${apiUrl}`);
}

function frontendDeploy() {
  console.log("\n### Implantando frontend ###");

  const apiUrl = tofuOutput("api_url");
  const bucketName = tofuOutput("frontend_bucket_name");
  const frontendUrl = tofuOutput("frontend_url");
  const distributionId = tofuOutput(
    "cloudfront_distribution_id"
  );

  ensureFrontendEnv(apiUrl);

  run("npm", ["install"], FRONTEND_DIR);
  run("npm", ["run", "build"], FRONTEND_DIR);

  run(
    "aws",
    [ "s3","sync","build/",`s3://${bucketName}`,"--delete","--region", config.region    ],
    FRONTEND_DIR
  );

  run("aws", [
    "cloudfront",
    "create-invalidation",
    "--distribution-id",
    distributionId,
    "--paths",
    "/*",
  ]);

  console.log(`Frontend publicado no bucket: ${bucketName}`);
  console.log(`Frontend URL: ${frontendUrl}`);
  console.log(`API URL: ${apiUrl}`);
}

function deploy() {
  validateConfig();
  checkAwsCredentials();

  backendDeploy();
  tofuApply();
  frontendDeploy();

  console.log("\nProjeto implantado com sucesso.");
}

function remove() {
  validateConfig();
  checkAwsCredentials();

  /*
   * A infraestrutura precisa ser removida antes da Lambda.
   * O OpenTofu consulta a função com data.aws_lambda_function.
   */
  tofuDestroy();
  backendRemove();

  console.log("\nRecursos removidos com sucesso.");
}

function clean() {
  removeDir(path.resolve(BACKEND_DIR, ".serverless"));
  removeDir(path.resolve(BACKEND_DIR, "node_modules"));
  removeDir(path.resolve(BACKEND_DIR, "dist"));

  removeDir(path.resolve(FRONTEND_DIR, "node_modules"));
  removeDir(path.resolve(FRONTEND_DIR, "build"));
  removeDir(path.resolve(FRONTEND_DIR, "dist"));

  console.log("\nArtefatos locais removidos.");
}

function showHelp() {
  console.log(`
Comandos disponíveis:

  node cli.js deploy
  node cli.js remove
  node cli.js cls
`);
}

const command = process.argv[2] || "help";

try {
  switch (command) {
    case "deploy":
      deploy();
      break;

    case "remove":
      remove();
      break;

    case "cls":
      clean();
      break;

    default:
      showHelp();
  }
} catch (error) {
  console.error("\nFalha durante a execução.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
}