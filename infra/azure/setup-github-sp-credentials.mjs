#!/usr/bin/env node
/**
 * Gera/atualiza local/azure-credentials-gh.json para o secret AZURE_CREDENTIALS no GitHub.
 * Uso: node infra/azure/setup-github-sp-credentials.mjs
 */
import { execSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const outPath = join(root, "local", "azure-credentials-gh.json");

const subscriptionId = "3fc4ec17-e9f3-47d2-a25a-64c2293eb847";
const tenantId = "cf72e2bd-7a2b-4783-bdeb-39d57b07f76f";
const resourceGroup = "RG-PROCON-BOT-VM";
const spDisplayName = "github-abp6-vm-schedule";
const scope = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}`;

function az(args) {
  return execSync(`az ${args}`, { encoding: "utf8" }).trim();
}

function azSpawn(args) {
  const r = spawnSync("az", args, { encoding: "utf8", shell: false });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || `az ${args.join(" ")} failed`);
  }
  return (r.stdout || "").trim();
}

let appId;
let clientSecret;
const listed = JSON.parse(
  az(`ad sp list --filter "displayName eq '${spDisplayName}'" -o json`) || "[]",
);
if (listed.length > 0) {
  appId = listed[0].appId;
  console.log(`Service principal existente: ${appId}`);
  const reset = JSON.parse(az(`ad sp credential reset --id ${appId} -o json`));
  appId = reset.appId;
  clientSecret = reset.password;
} else {
  const created = JSON.parse(
    az(
      `ad sp create-for-rbac --name ${spDisplayName} --role "Virtual Machine Contributor" --scopes ${scope} -o json`,
    ),
  );
  appId = created.appId;
  clientSecret = created.password;
}

const creds = {
  clientId: appId,
  clientSecret,
  subscriptionId,
  tenantId,
  activeDirectoryEndpointUrl: "https://login.microsoftonline.com",
  resourceManagerEndpointUrl: "https://management.azure.com/",
  activeDirectoryGraphResourceId: "https://graph.windows.net/",
  sqlManagementEndpointUrl: "https://management.core.windows.net:8443/",
  galleryEndpointUrl: "https://gallery.azure.com/",
  managementEndpointUrl: "https://management.core.windows.net/",
};

writeFileSync(outPath, JSON.stringify(creds, null, 2), "utf8");
console.log(`Credenciais gravadas em ${outPath}`);

await (async () => {
try {
  execSync("az logout", { stdio: "ignore" });
} catch {
  /* ignore */
}

console.log("Aguardando propagação do secret (30s)...");
await sleep(30_000);

azSpawn([
  "login",
  "--service-principal",
  "--username",
  appId,
  "--password",
  clientSecret,
  "--tenant",
  tenantId,
  "-o",
  "none",
]);
const vm = azSpawn([
  "vm",
  "show",
  "-g",
  "RG-PROCON-BOT-VM",
  "-n",
  "vm-procon-bot-docker",
  "--query",
  "name",
  "-o",
  "tsv",
]);
console.log(`Teste SP OK — VM: ${vm}`);
execSync("az logout", { stdio: "ignore" });
console.log("Cole o conteúdo do JSON no secret GitHub AZURE_CREDENTIALS.");
})().catch((err) => {
  console.error(err.message || err);
  try {
    execSync("az login -o none", { stdio: "ignore" });
  } catch {
    /* ignore */
  }
  process.exit(1);
});
