# Deploy na Azure VM com Docker (bot + painel)

Guia operacional para publicar o projeto em **uma VM Linux** com Docker Compose.

## 1) Pré-requisitos

- Azure CLI autenticado (`az login`).
- Resource Group e VM Linux já criados.
- Porta 80 liberada no NSG da VM.
- Projeto local com:
  - `docker-compose.yml`
  - `Dockerfile` (bot)
  - `painel-interno/Dockerfile`
  - `painel-interno/nginx.conf`
- Sessão WhatsApp já disponível em `security/.wwebjs_auth`.

## 2) Preparar ambiente Docker na VM

Executar:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra/azure/bootstrap-vm-docker.ps1 `
  -ResourceGroup "<RG>" `
  -VmName "<VM_NAME>"
```

Esse script instala Docker Engine + Compose plugin, habilita serviço no boot e cria diretório `/opt/procon-bot`.

## 3) Empacotar e enviar projeto para a VM

Executar:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra/azure/deploy-vm-docker.ps1 `
  -VmHost "<IP_OU_DNS_DA_VM>" `
  -SshUser "azureuser"
```

O script:

- gera `tmp/vm-deploy/procon-vm-docker.tgz` (sem `.git`, `node_modules`, `dist`);
- envia via `scp` para a VM;
- extrai em `/opt/procon-bot`;
- sobe com `docker compose up -d --build`.

## 4) Variáveis e segredos

Arquivo local obrigatório:

- `security/.env` (montado como volume no container `bot`).

Se usar login Entra ID no painel, também definir no host (antes do build do painel):

- `PAINEL_VITE_AZURE_CLIENT_ID`
- `PAINEL_VITE_AZURE_TENANT_ID`
- `PAINEL_VITE_AZURE_REDIRECT_URI`

Token estático do painel (opcional):

- `PAINEL_VITE_ADMIN_PANEL_TOKEN`

## 5) Health checks rápidos

Na VM:

```bash
cd /opt/procon-bot
docker compose ps
curl -fsS http://localhost:3000/healthz
```

No navegador:

- `http://<VM_HOST>:80` (painel)

## 6) Rollback rápido

No diretório `/opt/procon-bot`, manter uma cópia de release anterior (`/opt/procon-bot-prev`).

Rollback:

```bash
sudo rm -rf /opt/procon-bot
sudo mv /opt/procon-bot-prev /opt/procon-bot
cd /opt/procon-bot
docker compose up -d --build
```

## 7) Observações

- A sessão WhatsApp persiste em `security/.wwebjs_auth` (volume bind no serviço `bot`).
- Em produção, preferir HTTPS com Nginx/Caddy no host apontando para o painel (porta 80) e API (porta 3000) conforme necessidade.
