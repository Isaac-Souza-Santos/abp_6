# Backlog do produto – Bot Procon Jacareí WhatsApp

Backlog do produto em **3 sprints**. Requisitos (RF/RNF) no topo; tarefas por sprint abaixo.

---

## Requisitos funcionais (RF)

O que o sistema **deve fazer** – funcionalidades e fluxos para o usuário.

| ID   | Requisito | Prioridade | Relação com tarefas |
|------|-----------|------------|----------------------|
| RF01 | Conectar ao WhatsApp e exibir QR Code para autenticação | Alta | 1.2 |
| RF02 | Manter sessão após primeiro login (LocalAuth) | Alta | 1.3 |
| RF03 | Responder a "oi", "menu" e opções 1 a 5 com fluxo de boas-vindas | Alta | 1.4 |
| RF04 | Apresentar textos oficiais (orientações, direitos, reclamação) alinhados ao CDC e ao Procon | Alta | 2.1 |
| RF05 | Exibir contato e endereço do Procon Jacareí (configuráveis) nas opções 3 e 4 | Alta | 2.2 |
| RF06 | Tratar mensagens não reconhecidas com resposta amigável sugerindo "menu" ou "início" | Média | 2.3 |
| RF07 | Oferecer agendamento com fluxo nome → motivo → data e confirmação; persistir em `data/agendamentos.json` | Alta | 2.4 |
| RF08 | Obter consentimento LGPD antes de coletar dados no agendamento (SIM/NÃO; sem coleta se NÃO) | Alta | 2.5 |
| RF09 | Listar horários livres (slots de 30 min) e reservar slot ao confirmar agendamento | Alta | 2.6 |
| RF10 | Painel do atendente: comandos *atendente* / *historico* / *metricas* para ADMIN_NUMBER | Alta | 3.1 |
| RF11 | Métricas do protocolo (vira dado, vira processo, gestão); comandos *processo [ID]* e *gestao [ID]* atualizam agendamento | Alta | 3.2 |
| RF12 | (Opcional) Criar evento no calendário (Outlook) ao confirmar agendamento | Baixa | 3.7 |
| RF13 | Responder dúvidas em texto livre via IA (Groq) com contexto CDC/Procon e métricas satisfatória/não satisfatória | Alta | 3.9 |

---


## User Stories

| ID US | Ref. Requisito | História de Usuário  |
|-------|----------------|----------------------------------------------------------------------------------|
| US01  | RF01 | **Como** administrador do sistema, **quero** exibir o QR Code de autenticação ao iniciar, **para** conectar o sistema à conta oficial do WhatsApp do Procon. |
| US02  | RF02 | **Como** administrador do sistema, **quero** que a sessão seja mantida (LocalAuth) após o primeiro login, **para** evitar a necessidade de ler o QR Code a cada reinicialização do servidor. |
| US03  | RF03 | **Como** cidadão, **quero** receber uma mensagem de boas-vindas e um menu de opções (1 a 5) ao enviar "oi" ou "menu", **para** navegar facilmente pelas opções de autoatendimento. |
| US04  | RF04 | **Como** cidadão, **quero** acessar textos oficiais com orientações, direitos e formas de reclamação, **para** esclarecer minhas dúvidas com base no Código de Defesa do Consumidor (CDC). |
| US05  | RF05 | **Como** cidadão, **quero** visualizar o contato e o endereço atualizado do Procon Jacareí (opções 3 e 4), **para** saber como me comunicar ou chegar ao local físico de atendimento. |
| US06  | RF06 | **Como** cidadão, **quero** receber uma resposta amigável sugerindo digitar "menu" ou "início" ao enviar uma mensagem não reconhecida, **para** não ficar perdido no fluxo de atendimento. |
| US07  | RF07 | **Como** cidadão, **quero** realizar um agendamento informando meu nome, motivo e data preferida, **para** garantir que serei atendido presencialmente de forma organizada. |
| US08  | RF08 | **Como** cidadão, **quero** ser questionado se aceito a coleta dos meus dados (LGPD) antes do agendamento, **para** ter minha privacidade respeitada e meus dados protegidos. |
| US09  | RF09 | **Como** cidadão, **quero** poder visualizar e reservar horários livres (blocos de 30 minutos), **para** escolher um momento em que a equipe do Procon realmente tenha disponibilidade. |
| US10  | RF10 | **Como** atendente do Procon, **quero** acessar um painel administrativo via comandos no WhatsApp (ex: *atendente*, *historico*, *metricas*), **para** acompanhar os chamados e gerenciar o volume de atendimentos. |
| US11  | RF11 | **Como** atendente do Procon, **quero** atualizar as métricas do ciclo de vida de um protocolo (vira dado, vira processo, gestão) usando comandos específicos, **para** manter os dados do órgão precisos e embasar tomadas de decisão. |
| US12  | RF12 | **Como** atendente do Procon, **quero** que um evento seja criado automaticamente no calendário do Outlook ao confirmar um agendamento, **para** facilitar o controle da agenda da equipe de atendimento. |
| US13  | RF13 | **Como** cidadão, **quero** enviar dúvidas em texto livre e receber respostas da Inteligência Artificial baseadas no CDC, **para** obter respostas rápidas, podendo ao final avaliar a resposta como satisfatória ou não. |
---

## Requisitos não funcionais (RNF)

Como o sistema **deve se comportar** – qualidade, segurança, documentação e operação.

| ID   | Requisito | Prioridade | Relação com tarefas |
|------|-----------|------------|----------------------|
| RNF01 | Projeto em Node.js + TypeScript com `npm run build` e `npm run dev` funcionando | Alta | 1.1 |
| RNF02 | Documentação no README com pré-requisitos e comandos para rodar e escanear QR | Média | 1.5 |
| RNF03 | Textos curtos e objetivos (acessibilidade e clareza) | Média | 2.7 |
| RNF04 | (Opcional) Persistir sessão em ambiente de produção com instruções ou código para deploy | Baixa | 2.8 |
| RNF05 | Tratamento de erros e logs (falha de conexão, auth); mensagem amigável ao usuário quando aplicável | Alta | 3.3 |
| RNF06 | Documentação: README completo, arquitetura e variáveis de ambiente (ex.: docs/ARQUITETURA.md) | Alta | 3.4 |
| RNF07 | Guia de deploy (ex.: servidor/VPS ou App Service) em docs (ex.: docs/PASSO-A-PASSO.md) | Média | 3.5 |
| RNF08 | Segurança: `.env` e `data/` no .gitignore; sessão não commitada; orientações no README | Alta | 3.6 |
| RNF09 | Atualizar Projects/Kanban com status final das tarefas do sprint | Média | 3.8 |

---

## Sprint 1 – Fundação e conexão

**Objetivo:** Projeto rodando em TypeScript com WhatsApp conectado e menu inicial.

| ID  | Tarefa | Prioridade | Critério de aceite |
|-----|--------|------------|---------------------|
| 1.1 | Configurar projeto Node.js + TypeScript | Alta | `npm run build` e `npm run dev` funcionando |
| 1.2 | Integrar biblioteca whatsapp-web.js (API gratuita) | Alta | Cliente inicializa e exibe QR Code |
| 1.3 | Implementar autenticação local (LocalAuth) | Alta | Sessão persiste após primeiro login |
| 1.4 | Criar fluxo de boas-vindas e menu (opções 1 a 5) | Alta | Resposta a "oi", "menu" e opções 1 a 5 |
| 1.5 | Documentar no README como rodar e escanear QR | Média | README com pré-requisitos e comandos |

**Entrega Sprint 1:** Bot responde no WhatsApp com menu do Procon Jacareí (opções 1–5).

**Apresentação (vídeo):** [Sprint 1 no YouTube](https://www.youtube.com/watch?v=91aUjvrli_g)

---

## Sprint 2 – Atendimento, conteúdo e agendamento

**Objetivo:** Conteúdo útil ao cidadão, fluxos claros e agendamento com LGPD e horários livres.

| ID  | Tarefa | Prioridade | Critério de aceite |
|-----|--------|------------|---------------------|
| 2.1 | Implementar textos oficiais (orientações, direitos, reclamação) | Alta | Respostas alinhadas ao CDC e ao Procon |
| 2.2 | Incluir contato e endereço Procon Jacareí (configurável) | Alta | Opção 3 e 4 com dados atualizáveis em MenuService |
| 2.3 | Tratar mensagens não reconhecidas com resposta amigável | Média | Resposta padrão sugere "menu" ou "início" |
| 2.4 | Implementar opção 6 – Agendamento (fluxo nome → motivo → data) | Alta | Fluxo completo com confirmação; dados em `data/agendamentos.json` |
| 2.5 | Consentimento LGPD antes de coletar dados no agendamento | Alta | Texto de consentimento; usuário digita SIM/NÃO; sem coleta se NÃO |
| 2.6 | Horários livres: listar slots disponíveis e reservar slot ao confirmar | Alta | Opção "Ver horários livres" e slots de 30 min; ocupado/livre em agendamentos.json |
| 2.7 | Revisar textos com foco em acessibilidade e clareza | Média | Textos curtos e objetivos |
| 2.8 | (Opcional) Persistir sessão em ambiente de produção | Baixa | Instruções ou código para deploy |

**Entrega Sprint 2:** Atendimento completo via menu (1–6), agendamento com LGPD e horários livres.

**Extensão – painel web (tarefas adicionais):** ver [documentacao/SPRINT-2-PAINEL-INTERNO.md](../documentacao/SPRINT-2-PAINEL-INTERNO.md) (configuração em `data/`, UX, exportação, acessibilidade).

---

## Sprint 3 – Painel do atendente, métricas e entrega

**Objetivo:** Painel para atendente, métricas do ciclo do protocolo, integração opcional (Outlook), projeto estável e documentado.

| ID  | Tarefa | Prioridade | Critério de aceite |
|-----|--------|------------|---------------------|
| 3.1 | Painel do atendente: comando *atendente* / *historico* / *metricas* (ADMIN_NUMBER) | Alta | Resposta com histórico e métricas (total, hoje, 7 dias, por status) |
| 3.2 | Métricas do protocolo: vira dado, vira processo, gestão pública | Alta | Contagem por eixo; comandos *processo [ID]* e *gestao [ID]* atualizam agendamento |
| 3.3 | Tratamento de erros e logs (falha de conexão, auth) | Alta | Erros logados e mensagem amigável ao usuário quando aplicável |
| 3.4 | Documentação: README, arquitetura e variáveis de ambiente | Alta | README completo + doc de arquitetura (docs/ARQUITETURA.md) |
| 3.5 | Guia de deploy (ex.: servidor/VPS ou App Service) | Média | Passo a passo para colocar em produção (ex.: docs/PASSO-A-PASSO.md) |
| 3.6 | Checklist de segurança (.env, sessão não commitada) | Alta | .env e data/ no .gitignore; orientações no README |
| 3.7 | (Opcional) Integração Outlook: criar evento no calendário ao confirmar agendamento | Baixa | Variáveis Microsoft Graph; evento criado conforme docs/OUTLOOK-AGENDAMENTO.md |
| 3.8 | Atualizar Projects/Kanban com status final das tarefas | Média | Todas as issues do Sprint 3 em Done |
| 3.9 | Integrar Groq para dúvidas em texto livre (contexto CDC/Procon); avaliar resposta (satisfatória/não) e exibir em *metricas* | Alta | API Groq (tier gratuito); resposta para mensagens não reconhecidas; data/groq-metricas.json; comando *metricas* inclui totais Groq |

**Entrega Sprint 3:** Painel do atendente com métricas (vira dado, processo, gestão, Groq), documentação e guia de deploy; Outlook opcional.

---

## Resumo das entregas por sprint

| Sprint | Entrega principal |
|--------|--------------------|
| **Sprint 1** | Bot conectado ao WhatsApp com menu inicial (TypeScript + whatsapp-web.js) |
| **Sprint 2** | Conteúdo completo (1–5) + Agendamento (6) com LGPD e horários livres |
| **Sprint 3** | Painel atendente, métricas do protocolo, Groq (dúvidas em texto livre), documentação e guia de deploy |

---

## Referência rápida

- **Requisitos:** Requisitos funcionais (RF) e não funcionais (RNF) no início deste arquivo.
- **Template de issue:** `.github/ISSUE_TEMPLATE/tarefa_kanban.md`
- **Kanban de referência:** `.github/PROJECT_KANBAN.md`
- **Documentação:** `docs/ARQUITETURA.md`, `docs/AGENDA-LIVRE-OCUPADA.md`, `docs/METRICAS-PROTOCOLO.md`, `docs/OUTLOOK-AGENDAMENTO.md`

Este backlog deve ser versionado no repositório e atualizado conforme as tarefas forem concluídas ou o escopo for repriorizado.
