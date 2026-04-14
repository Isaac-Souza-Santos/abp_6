/**
 * Monta Azure Files no Container App (volume + volumeMounts) e alinha AUTH_PATH/DATA_DIR.
 * Usa ARM PUT com payload mínimo (API 2024-03-01) porque o `az containerapp update` não expõe AzureFile.
 * Pré-requisito: `az containerapp env storage set` já ter registrado o share com o mesmo --storage-name.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

function az(args) {
  const cmd = process.platform === "win32" ? "az.cmd" : "az";
  return execFileSync(cmd, args, { encoding: "utf8" });
}

function parseArgs(argv) {
  const o = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input") o.input = argv[++i];
    else if (a === "--output") o.output = argv[++i];
    else if (a === "--resource-group") o.rg = argv[++i];
    else if (a === "--name") o.app = argv[++i];
    else if (a === "--env-storage-name") o.envStorageName = argv[++i];
    else if (a === "--volume-name") o.volumeName = argv[++i];
    else if (a === "--mount-path") o.mountPath = argv[++i];
    else if (a === "--auth-path") o.authPath = argv[++i];
    else if (a === "--data-dir") o.dataDir = argv[++i];
    else if (a === "--image") o.image = argv[++i];
  }
  return o;
}

const opts = parseArgs(process.argv);
if (!opts.input || !opts.output) {
  console.error(
    "Uso: node apply-persist-volume.mjs --input show.json --output put.json --env-storage-name botpersistshare [--volume-name persist-vol] [--mount-path /mnt/persist] [--auth-path ...] [--data-dir ...] [--image ...]"
  );
  process.exit(1);
}

const envStorageName = opts.envStorageName || "botpersistshare";
const volumeName = opts.volumeName || "persist-vol";
const mountPath = opts.mountPath || "/mnt/persist";
const authPath = (opts.authPath || `${mountPath}/.wwebjs_auth`).replace(/\/$/, "");
const dataDir = opts.dataDir || `${mountPath}/data`;
const sessionMountPath = `${authPath}/session`;
/** EmptyDir sobrepõe só `session/`: locks do Chromium ficam no disco local da réplica (Azure Files não suporta symlink aqui). */
const sessionEmptyVolName = "chrome-session-empty";

let raw = readFileSync(opts.input, "utf8");
raw = raw.replace(/^\uFEFF/, "").trim();
const app = JSON.parse(raw);

const id = app.id;
if (!id || !id.includes("/subscriptions/")) {
  throw new Error("Resposta de containerapp show sem id ARM valido.");
}

const orig = app.properties.template;
const c = JSON.parse(JSON.stringify(orig.containers[0]));
delete c.imageType;
if (opts.image) c.image = opts.image;
c.volumeMounts = [
  { volumeName, mountPath },
  { volumeName: sessionEmptyVolName, mountPath: sessionMountPath },
];
for (const e of c.env) {
  if (e.name === "AUTH_PATH" && e.value !== undefined) e.value = authPath;
  if (e.name === "DATA_DIR" && e.value !== undefined) e.value = dataDir;
}

const sc = orig.scale;
const template = {
  containers: [c],
  volumes: [
    { name: volumeName, storageType: "AzureFile", storageName: envStorageName },
    { name: sessionEmptyVolName, storageType: "EmptyDir" },
  ],
  scale: { minReplicas: sc.minReplicas, maxReplicas: sc.maxReplicas },
};

const cfg = app.properties.configuration;
const ing = cfg.ingress;
const minimalCfg = {
  activeRevisionsMode: cfg.activeRevisionsMode,
  ingress: {
    external: ing.external,
    targetPort: ing.targetPort,
    allowInsecure: ing.allowInsecure,
    transport: ing.transport,
    traffic: ing.traffic,
  },
  registries: cfg.registries,
  secrets: cfg.secrets,
};

const put = {
  location: app.location,
  identity: app.identity,
  properties: {
    managedEnvironmentId: app.properties.managedEnvironmentId,
    configuration: minimalCfg,
    template,
  },
};
if (app.tags) put.tags = app.tags;

writeFileSync(opts.output, JSON.stringify(put));

const url = `https://management.azure.com${id}?api-version=2024-03-01`;
try {
  execFileSync(process.platform === "win32" ? "az.cmd" : "az", ["rest", "--method", "put", "--url", url, "--body", `@${opts.output}`], {
    encoding: "utf8",
    stdio: "inherit",
  });
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
