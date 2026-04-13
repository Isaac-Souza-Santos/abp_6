# 📋 Kanban – Bot Procon Jacareí WhatsApp

Projeto gerenciado em **modo Kanban** com **3 Sprints**. Use este documento como referência e replique as colunas no **GitHub Projects** (ou em outra ferramenta Kanban).

---

## Como usar no GitHub

1. No repositório: **Projects** → **New project** → **Board** (Kanban).
2. Crie as colunas: **Backlog** | **To Do** | **In Progress** | **Review** | **Done**.
3. Crie os **milestones** (ou labels) para cada sprint: `Sprint 1`, `Sprint 2`, `Sprint 3`.
4. Crie **Issues** para cada tarefa abaixo e mova entre as colunas conforme o andamento.
5. Associe cada issue ao **milestone** do sprint correspondente.

---

## Colunas do quadro Kanban

| Backlog | To Do | In Progress | Review | Done |
|---------|--------|-------------|--------|------|
| Itens futuros | Próximas tarefas do sprint | Em desenvolvimento | Em revisão | Concluído |

---

## Sprint 1 – Fundação e conexão (Semana 1–2)

**Objetivo:** Projeto rodando em TypeScript com WhatsApp conectado e menu inicial.

| # | Tarefa | Prioridade | Critério de aceite |
|---|--------|------------|---------------------|
| 1.1 | Configurar projeto Node.js + TypeScript | Alta | `npm run build` e `npm run dev` funcionando |
| 1.2 | Integrar biblioteca whatsapp-web.js (API gratuita) | Alta | Cliente inicializa e exibe QR Code |
| 1.3 | Implementar autenticação local (LocalAuth) | Alta | Sessão persiste após primeiro login |
| 1.4 | Criar fluxo de boas-vindas e menu (1–5) | Alta | Resposta a "oi", "menu" e opções 1 a 5 |
| 1.5 | Documentar no README como rodar e escanear QR | Média | README com pré-requisitos e comandos |

**Entrega Sprint 1:** Bot responde no WhatsApp com menu do Procon Jacareí.

**Apresentação (vídeo):** [Sprint 1 no YouTube](https://www.youtube.com/watch?v=91aUjvrli_g)

---

## Sprint 2 – Atendimento e conteúdo (Semana 3–4)

**Objetivo:** Conteúdo útil ao cidadão e fluxos claros (orientações, reclamação, contato).

| # | Tarefa | Prioridade | Critério de aceite |
|---|--------|------------|---------------------|
| 2.1 | Implementar textos oficiais (orientações, direitos, reclamação) | Alta | Respostas alinhadas ao CDC e ao Procon |
| 2.2 | Incluir contato e endereço Procon Jacareí (configurável) | Alta | Opção 3 e 4 com dados atualizáveis |
| 2.3 | Tratar mensagens não reconhecidas com resposta amigável | Média | Resposta padrão sugere "menu" |
| 2.4 | (Opcional) Persistir sessão em ambiente de produção | Baixa | Instruções ou código para deploy |
| 2.5 | Revisar textos com foco em acessibilidade e clareza | Média | Textos curtos e objetivos |

**Entrega Sprint 2:** Atendimento completo via menu (orientações, reclamação, contato, horário, direitos).

---

## Sprint 3 – Qualidade e entrega (Semana 5–6)

**Objetivo:** Projeto estável, documentado e pronto para uso interno/avaliação.

| # | Tarefa | Prioridade | Critério de aceite |
|---|--------|------------|---------------------|
| 3.1 | Tratamento de erros e logs (falha de conexão, auth) | Alta | Erros logados e mensagem amigável ao usuário |
| 3.2 | Documentação: README, arquitetura e variáveis de ambiente | Alta | README completo + doc de arquitetura |
| 3.3 | Guia de deploy (ex.: servidor/VPS ou Docker) | Média | Passo a passo para colocar em produção |
| 3.4 | Checklist de segurança (não expor sessão, uso de .env) | Alta | .env no .gitignore e orientações no README |
| 3.5 | Integrar Groq para dúvidas em texto livre (contexto CDC/Procon); métricas satisfatória/não satisfatória | Alta | API Groq (tier gratuito); resposta para texto livre; data/groq-metricas.json; *metricas* inclui totais Groq |
| 3.6 | Atualizar KANBAN/Projects com status final das tarefas | Média | Todas as issues do Sprint 3 em Done |

**Entrega Sprint 3:** Projeto documentado, com tratamento de erros, Groq (dúvidas em texto livre) e guia de deploy.

---

## Resumo das entregas por sprint

| Sprint | Entrega principal |
|--------|--------------------|
| **Sprint 1** | Bot conectado ao WhatsApp com menu inicial (TypeScript + whatsapp-web.js) |
| **Sprint 2** | Conteúdo completo: orientações, reclamação, contato, horário, direitos |
| **Sprint 3** | Estabilidade, Groq (dúvidas em texto livre), documentação e guia de deploy |

---

## APIs utilizadas (gratuitas)

- **whatsapp-web.js** – Biblioteca open source que utiliza o WhatsApp Web (multidevice), sem custo de API.  
- **Groq** – API de IA (tier gratuito) para dúvidas em texto livre com contexto CDC/Procon.  
- Alternativa futura: **Evolution API** (self-hosted, REST + webhooks), também gratuita.

Este documento deve ser versionado no Git junto ao código e atualizado conforme as tarefas forem concluídas.
