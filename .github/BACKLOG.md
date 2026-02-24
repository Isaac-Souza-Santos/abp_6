# Backlog do produto – Bot Procon Jacareí WhatsApp

Backlog único para uso com **GitHub Projects**. As tarefas estão divididas em **3 sprints**; você pode criar um projeto Kanban, milestones por sprint e issues a partir desta lista.

---

## Como usar no GitHub Projects

### 1. Criar o projeto

- No repositório: **Projects** → **New project** → **Board** (Kanban).

### 2. Colunas do quadro

Crie as colunas na ordem:

| Coluna       | Uso                          |
|-------------|------------------------------|
| **Backlog** | Itens futuros / não planejados |
| **To Do**   | Próximas tarefas do sprint    |
| **In Progress** | Em desenvolvimento        |
| **Review**  | Em revisão                   |
| **Done**    | Concluído                    |

### 3. Milestones (sprints)

Em **Issues** → **Milestones** → **New milestone**:

- **Sprint 1** – Fundação e conexão  
- **Sprint 2** – Atendimento, conteúdo e agendamento  
- **Sprint 3** – Painel, métricas e entrega  

### 4. Criar as tasks

- Use o template **Tarefa Kanban** (`.github/ISSUE_TEMPLATE/tarefa_kanban.md`).
- Crie uma **Issue** para cada tarefa abaixo.
- Associe cada issue ao **milestone** do sprint correspondente.
- Mova os cards entre as colunas conforme o andamento.

### 5. Labels (opcional)

Sugestão de labels: `Sprint 1`, `Sprint 2`, `Sprint 3`, `prioridade-alta`, `prioridade-media`, `prioridade-baixa`.

---

## Backlog completo (todas as tarefas)

Cada item pode virar uma **Issue**. O número no início (ex.: 1.1) é o **ID da tarefa**; use no título da issue, ex.: `[Sprint 1] 1.1 – Configurar projeto Node.js + TypeScript`.

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

---

## Sprint 3 – Painel do atendente, métricas e entrega

**Objetivo:** Painel para atendente, métricas do ciclo do protocolo, integração opcional (Outlook), projeto estável e documentado.

| ID  | Tarefa | Prioridade | Critério de aceite |
|-----|--------|------------|---------------------|
| 3.1 | Painel do atendente: comando *atendente* / *historico* / *metricas* (ADMIN_NUMBER) | Alta | Resposta com histórico e métricas (total, hoje, 7 dias, por status) |
| 3.2 | Métricas do protocolo: vira dado, vira processo, gestão pública | Alta | Contagem por eixo; comandos *processo [ID]* e *gestao [ID]* atualizam agendamento |
| 3.3 | Tratamento de erros e logs (falha de conexão, auth) | Alta | Erros logados e mensagem amigável ao usuário quando aplicável |
| 3.4 | Documentação: README, arquitetura e variáveis de ambiente | Alta | README completo + doc de arquitetura (docs/ARQUITETURA.md) |
| 3.5 | Guia de deploy (ex.: servidor/VPS ou Docker) | Média | Passo a passo para colocar em produção (ex.: docs/PASSO-A-PASSO.md) |
| 3.6 | Checklist de segurança (.env, sessão não commitada) | Alta | .env e data/ no .gitignore; orientações no README |
| 3.7 | (Opcional) Integração Outlook: criar evento no calendário ao confirmar agendamento | Baixa | Variáveis Microsoft Graph; evento criado conforme docs/OUTLOOK-AGENDAMENTO.md |
| 3.8 | Atualizar Projects/Kanban com status final das tarefas | Média | Todas as issues do Sprint 3 em Done |

**Entrega Sprint 3:** Painel do atendente com métricas (vira dado, processo, gestão), documentação e guia de deploy; Outlook opcional.

---

## Resumo das entregas por sprint

| Sprint | Entrega principal |
|--------|--------------------|
| **Sprint 1** | Bot conectado ao WhatsApp com menu inicial (TypeScript + whatsapp-web.js) |
| **Sprint 2** | Conteúdo completo (1–5) + Agendamento (6) com LGPD e horários livres |
| **Sprint 3** | Painel atendente, métricas do protocolo, documentação e guia de deploy |

---

## Backlog futuro (melhorias)

Itens para depois dos 3 sprints; podem virar novas issues quando quiser.

| Tarefa | Prioridade |
|--------|------------|
| Migrar para Evolution API (REST + webhooks) para separar conexão do bot | Média |
| Migrar agendamentos de JSON para banco (ex.: SQLite/PostgreSQL) | Média |
| Painel admin (web) para atualizar textos e ver/editar agendamentos | Baixa |
| Testes automatizados (unitários e/ou E2E) | Média |
| Dockerfile para deploy em container | Baixa |

---

## Referência rápida

- **Template de issue:** `.github/ISSUE_TEMPLATE/tarefa_kanban.md`
- **Kanban de referência:** `.github/PROJECT_KANBAN.md`
- **Documentação:** `docs/ARQUITETURA.md`, `docs/AGENDA-LIVRE-OCUPADA.md`, `docs/METRICAS-PROTOCOLO.md`, `docs/OUTLOOK-AGENDAMENTO.md`

Este backlog deve ser versionado no repositório e atualizado conforme as tarefas forem concluídas ou o escopo for repriorizado.
