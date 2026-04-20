<#
.SYNOPSIS
  Gera ZIP pronto para Azure App Service (Linux): build Vite + Express estático.
.DESCRIPTION
  Exige variáveis de ambiente VITE_API_BASE_URL (e opcionalmente VITE_ADMIN_PANEL_TOKEN)
  antes de executar, para embutir no bundle do painel.
#>
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$OutZip = (Join-Path $PSScriptRoot "painel-app-service.zip")
)

$ErrorActionPreference = "Stop"

if (-not $env:VITE_API_BASE_URL) {
  throw "Defina VITE_API_BASE_URL (ex.: https://procon-bot.xxx.azurecontainerapps.io sem barra final)."
}

$panelDir = Join-Path $RepoRoot "painel-interno"
if (-not (Test-Path $panelDir)) { throw "Pasta nao encontrada: $panelDir" }

Push-Location $panelDir
try {
  npm ci
  npm run build
} finally {
  Pop-Location
}

$stage = Join-Path $env:TEMP ("painel-appservice-" + [guid]::NewGuid().ToString("n"))
New-Item -ItemType Directory -Path (Join-Path $stage "dist") -Force | Out-Null
Copy-Item -Path (Join-Path $panelDir "dist\*") -Destination (Join-Path $stage "dist") -Recurse -Force
Copy-Item -Path (Join-Path $panelDir "azure-app-service-host\*") -Destination $stage -Force

Push-Location $stage
try {
  npm install --omit=dev
} finally {
  Pop-Location
}
if (Test-Path $OutZip) { Remove-Item $OutZip -Force }

# Compress-Archive no Windows grava caminhos com "\"; o Kudu Linux costuma falhar (HTTP 400).
# Gera ZIP com nomes de entrada só com "/" (compatível com Linux).
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$stageResolved = (Resolve-Path $stage).Path
$zipPathResolved = [System.IO.Path]::GetFullPath($OutZip)
$zipStream = [System.IO.File]::Open($zipPathResolved, [System.IO.FileMode]::Create, [System.IO.FileAccess]::ReadWrite)
try {
  $zip = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
  try {
    Get-ChildItem -LiteralPath $stageResolved -Recurse -File | ForEach-Object {
      $rel = $_.FullName.Substring($stageResolved.Length).TrimStart('\', '/').Replace('\', '/')
      if (-not $rel) { return }
      $entry = $zip.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
      $entryStream = $entry.Open()
      try {
        $fileStream = [System.IO.File]::OpenRead($_.FullName)
        try {
          $fileStream.CopyTo($entryStream)
        } finally {
          $fileStream.Dispose()
        }
      } finally {
        $entryStream.Dispose()
      }
    }
  } finally {
    $zip.Dispose()
  }
} finally {
  $zipStream.Dispose()
}

Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "ZIP gerado: $OutZip" -ForegroundColor Green
