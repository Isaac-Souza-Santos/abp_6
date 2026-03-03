# Cria a issue 3.9 (Groq) no GitHub via API. Não precisa do GitHub CLI (gh).
# Usa GITHUB_TOKEN e GITHUB_REPO do .env.
# Uso: na raiz do repo: .\.github\create-issue-3.9-groq.ps1

$envFile = Join-Path (Get-Location) ".env"
if (-not (Test-Path $envFile)) {
    Write-Error ".env não encontrado na raiz do repositório."
    exit 1
}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "Env:$name" -Value $value
    }
}

$token = $env:GITHUB_TOKEN
$repo = $env:GITHUB_REPO
if (-not $token) {
    Write-Error "GITHUB_TOKEN não definido no .env"
    exit 1
}
if (-not $repo) {
    Write-Error "GITHUB_REPO não definido no .env (ex.: owner/repo)"
    exit 1
}

$title = "[Sprint 3] 3.9 Integrar Groq para dúvidas em texto livre (contexto CDC/Procon)"
$body = @'
## Descrição
Integrar API Groq (tier gratuito) para responder dúvidas em texto livre com contexto CDC/Procon. Após a resposta, perguntar se ajudou (satisfatória/não) e exibir totais no comando *metricas*.

## Critério de aceite
- [ ] API Groq configurada (tier gratuito)
- [ ] Resposta para mensagens não reconhecidas (texto livre) via Groq
- [ ] Métricas persistidas em `data/groq-metricas.json`
- [ ] Comando *metricas* inclui totais Groq (satisfatória | não satisfatória)

## Sprint
Sprint 3

## Observações
Prioridade: Alta. Relação: RF13. Implementação já existente no código (GroqService, GroqMetricasStore, MessageHandler).
'@

$uri = "https://api.github.com/repos/$repo/issues"
$headers = @{
    Authorization = "Bearer $token"
    Accept        = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}
$payload = @{ title = $title; body = $body } | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $payload -ContentType "application/json; charset=utf-8"
    Write-Host "Issue 3.9 criada com sucesso: $($response.html_url)"
} catch {
    Write-Error "Falha ao criar issue: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    exit 1
}
