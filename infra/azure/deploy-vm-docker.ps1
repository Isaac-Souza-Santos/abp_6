param(
  [Parameter(Mandatory = $true)][string]$VmHost,
  [string]$SshUser = "azureuser",
  [string]$SshPort = "22"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$tmpDir = Join-Path $repoRoot "tmp\vm-deploy"
$archive = Join-Path $tmpDir "procon-vm-docker.tgz"

$scpBin = if (Get-Command scp -ErrorAction SilentlyContinue) {
  "scp"
} elseif (Test-Path "C:/Windows/System32/OpenSSH/scp.exe") {
  "C:/Windows/System32/OpenSSH/scp.exe"
} elseif (Test-Path "C:/Program Files/Git/usr/bin/scp.exe") {
  "C:/Program Files/Git/usr/bin/scp.exe"
} else {
  throw "scp não encontrado no sistema."
}

$sshBin = if (Get-Command ssh -ErrorAction SilentlyContinue) {
  "ssh"
} elseif (Test-Path "C:/Windows/System32/OpenSSH/ssh.exe") {
  "C:/Windows/System32/OpenSSH/ssh.exe"
} elseif (Test-Path "C:/Program Files/Git/usr/bin/ssh.exe") {
  "C:/Program Files/Git/usr/bin/ssh.exe"
} else {
  throw "ssh não encontrado no sistema."
}

New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
if (Test-Path $archive) { Remove-Item $archive -Force }

$lockFiles = @(
  "security/.wwebjs_auth/session/SingletonLock",
  "security/.wwebjs_auth/session/SingletonCookie",
  "security/.wwebjs_auth/session/SingletonSocket",
  "security/.wwebjs_auth/session/DevToolsActivePort"
)
foreach ($lockFile in $lockFiles) {
  $full = Join-Path $repoRoot $lockFile
  if (Test-Path $full) {
    Remove-Item $full -Force -ErrorAction SilentlyContinue
  }
}

Push-Location $repoRoot
try {
  Write-Host "==> Gerando pacote para deploy..."
  tar -czf "$archive" `
    --exclude=".git" `
    --exclude=".cursor" `
    --exclude="node_modules" `
    --exclude="dist" `
    --exclude="painel-interno/node_modules" `
    --exclude="painel-interno/dist" `
    --exclude="security/.wwebjs_auth/session/SingletonLock" `
    --exclude="security/.wwebjs_auth/session/SingletonCookie" `
    --exclude="security/.wwebjs_auth/session/SingletonSocket" `
    --exclude="security/.wwebjs_auth/session/DevToolsActivePort" `
    --exclude="**/SingletonLock" `
    --exclude="**/SingletonCookie" `
    --exclude="**/SingletonSocket" `
    --exclude="**/DevToolsActivePort" `
    --exclude="tmp" `
    .
}
finally {
  Pop-Location
}

$remote = "$SshUser@$VmHost"
$sshOptions = @(
  "-o", "StrictHostKeyChecking=accept-new",
  "-o", "BatchMode=yes",
  "-o", "ConnectTimeout=20"
)

Write-Host "==> Enviando pacote para VM ($remote)..."
& $scpBin @sshOptions -P $SshPort "$archive" "${remote}:/tmp/procon-vm-docker.tgz"
if ($LASTEXITCODE -ne 0) {
  throw "Falha no envio via SCP para a VM."
}

Write-Host "==> Extraindo e subindo containers..."
& $sshBin @sshOptions -p $SshPort $remote @'
set -eu
sudo mkdir -p /opt/procon-bot
cd /opt/procon-bot
sudo tar -xzf /tmp/procon-vm-docker.tgz
sudo chown -R "$USER":"$USER" /opt/procon-bot
sudo docker compose up -d --build
sudo docker compose ps
'@
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao executar deploy remoto via SSH."
}

Write-Host "==> Deploy concluído."
