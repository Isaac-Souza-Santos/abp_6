# Integração Outlook (Microsoft Graph) no agendamento

O bot usa a **API gratuita do Microsoft Graph** para criar um evento no calendário Outlook sempre que um cidadão confirma um agendamento. O evento aparece no calendário configurado (ex.: do Procon) com nome, motivo, telefone e data preferida.

## O que é necessário (gratuito)

- Conta **Microsoft 365** ou **Outlook.com** (a que terá o calendário).
- **Registro de aplicativo** no Azure (gratuito): [portal.azure.com](https://portal.azure.com) → Azure Active Directory → Registros de aplicativo → Novo registro.
- Permissão **Calendars.ReadWrite** (delegada) e um **refresh token** dessa conta.

## Passos resumidos

1. **Criar o app no Azure**
   - Nome: ex. "Procon Bot Agendamento".
   - Tipo: Contas em qualquer diretório organizacional e contas pessoais da Microsoft (se for Outlook.com).
   - Anotar: **ID do aplicativo (client_id)** e **ID do diretório (tenant)**. Criar um **segredo do cliente (client_secret)**.

2. **Permissões**
   - Em "Permissões de API" → Adicionar → Microsoft Graph → Permissões delegadas → marcar **Calendars.ReadWrite** → Conceder.

3. **Obter o refresh token**
   - Fluxo OAuth 2.0 com consentimento do usuário (uma vez). O usuário faz login e autoriza o app a acessar o calendário; o app troca o `code` por `access_token` e `refresh_token`.
   - Você pode usar o [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer) para testar, mas para o refresh token é preciso um fluxo de autorização (ex.: app web simples que redireciona para login da Microsoft e mostra o code; depois troca o code por token e exibe o refresh_token para copiar).
   - Ferramentas alternativas: [oauth2 refresh token generator](https://github.com/nicolo-ribaudo/outlook-refresh-token) ou scripts prontos na web para "get Microsoft refresh token".

4. **Configurar o `.env`**
   - `OUTLOOK_CLIENT_ID` = ID do aplicativo.
   - `OUTLOOK_CLIENT_SECRET` = valor do segredo do cliente.
   - `OUTLOOK_REFRESH_TOKEN` = refresh token obtido no passo 3.
   - `OUTLOOK_TENANT_ID` = `common` (ou o ID do diretório se for só trabalho/escola).
   - `OUTLOOK_TIMEZONE` = opcional; padrão `E. South America Standard Time` (Brasil).

Se alguma dessas variáveis não estiver definida, o bot **não envia** nada para o Outlook (o agendamento continua sendo salvo normalmente em `data/agendamentos.json`).

## Comportamento

- Ao confirmar um agendamento no WhatsApp, o bot salva os dados e **tenta** criar um evento no calendário Outlook.
- O evento usa a **data preferida** informada (ex.: 15/03/2025 vira 15/03 às 9h; texto livre como "o mais cedo possível" vira amanhã às 9h), duração de 30 minutos, fuso `OUTLOOK_TIMEZONE`.
- Título: `Procon Jacareí - [Nome]`. Corpo: motivo, telefone, data preferida e ID do agendamento.
- Falhas na API (token expirado, rede, etc.) são apenas logadas no console; o usuário já recebeu a confirmação no WhatsApp.

## Referências

- [Microsoft Graph – Create event](https://learn.microsoft.com/en-us/graph/api/calendar-post-events)
- [Registro de aplicativo no Azure](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
