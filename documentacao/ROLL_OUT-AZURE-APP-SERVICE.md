# Rollout Azure App Service (backend + painel)

Este roteiro define a ordem de publicação para evitar quebra entre API e painel.

## 1) Preparar variáveis/secrets no GitHub

Secrets:
- `AZURE_CREDENTIALS`
- `AZURE_WEBAPP_NAME_BACKEND`
- `AZURE_WEBAPP_NAME_PAINEL`
- `PAINEL_VITE_API_BASE_URL` (apontar para a URL do backend App Service)
- `PAINEL_VITE_ADMIN_PANEL_TOKEN` (se usar token estático no painel)

Variables:
- `AZURE_SUBSCRIPTION_ID` (opcional, recomendado)
- `AZURE_RG`
- `AZURE_WEBAPP_RG` (opcional, recomendado)
- `AZURE_WEBAPP_RG_BACKEND` (opcional, quando backend estiver em RG dedicado)

## 2) Publicar backend primeiro

Executar workflow:
- `Deploy backend App Service` (`.github/workflows/azure-backend-app-service.yml`)

Critério de aceite:
- Workflow finaliza com sucesso.
- Etapa `Smoke test do backend` retorna HTTP 200 em `/healthz`.

## 3) Atualizar URL da API do painel

Confirmar no GitHub secret:
- `PAINEL_VITE_API_BASE_URL=https://<nome-backend>.azurewebsites.net`

Observação:
- usar sem barra final para manter consistência com os workflows.

## 4) Publicar painel

Executar workflow:
- `Deploy painel App Service` (`.github/workflows/azure-painel-app-service.yml`)

Critério de aceite:
- Build e deploy concluídos sem erro.
- Painel carrega normalmente e lista dados de `/admin/agendamentos`.

## 5) Validação funcional final

Checklist:
- `GET /healthz` do backend retorna 200.
- Painel autentica (token estático ou Azure AD, conforme ambiente).
- Lista de agendamentos abre sem erro.
- Atualização em `/admin/agendamentos/:id` funciona.
- Logs da aplicação sem erros críticos após o deploy.

## 6) Rollback

Se houver falha no painel:
- restaurar `PAINEL_VITE_API_BASE_URL` para URL anterior e fazer novo deploy do painel.

Se houver falha no backend:
- reexecutar deploy com commit anterior conhecido estável.

## 7) Descomissionar recursos antigos (manual na Azure)

Fazer apenas depois de backend + painel estarem estáveis em App Service.

Ordem recomendada:
- remover Container App antigo (se existir)
- remover ACR antigo (se não houver outro sistema usando)
- remover Storage/File Share usados apenas pelo Container App
- remover recursos auxiliares antigos (ambiente ACA, logs antigos dedicados), se sem uso

Checklist antes de apagar:
- confirmar que `PAINEL_VITE_API_BASE_URL` aponta para App Service do backend
- confirmar workflows ativos: `azure-backend-app-service.yml` e `azure-painel-app-service.yml`
- validar que não há outro projeto usando os mesmos recursos antigos

Exemplo de comandos (`az`) para executar manualmente:
- `az containerapp delete -g <RG_ANTIGO> -n <CONTAINER_APP> --yes`
- `az acr delete -g <RG_ANTIGO> -n <ACR_NAME> --yes`
- `az storage account delete -g <RG_ANTIGO> -n <STORAGE_NAME> --yes`

