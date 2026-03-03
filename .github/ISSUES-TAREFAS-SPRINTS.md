# Issues para criar – Tarefas do Backlog

Use este arquivo para criar as **issues** no GitHub. Em **New issue** → escolha o template **"Tarefa Kanban"** e preencha com o **título** e o **corpo** de cada seção abaixo (copie e cole).

Referência: [BACKLOG.md](BACKLOG.md) e [PROJECT_KANBAN.md](PROJECT_KANBAN.md).

---

## Sprint 1

### Issue 1.1 – Configurar projeto Node.js + TypeScript

**Título:** `[Sprint 1] 1.1 Configurar projeto Node.js + TypeScript`

**Corpo (cole no template):**

```markdown
## Descrição
Configurar projeto Node.js + TypeScript para o bot Procon Jacareí.

## Critério de aceite
- [ ] `npm run build` funciona
- [ ] `npm run dev` funciona

## Sprint
Sprint 1

## Observações
Prioridade: Alta. Relação: RNF01.
```

---

### Issue 1.2 – Integrar biblioteca whatsapp-web.js

**Título:** `[Sprint 1] 1.2 Integrar biblioteca whatsapp-web.js (API gratuita)`

**Corpo:**

```markdown
## Descrição
Integrar biblioteca whatsapp-web.js para conexão com WhatsApp.

## Critério de aceite
- [ ] Cliente inicializa
- [ ] Exibe QR Code para autenticação

## Sprint
Sprint 1

## Observações
Prioridade: Alta. Relação: RF01.
```

---

### Issue 1.3 – Implementar autenticação local (LocalAuth)

**Título:** `[Sprint 1] 1.3 Implementar autenticação local (LocalAuth)`

**Corpo:**

```markdown
## Descrição
Implementar autenticação local para persistir sessão do WhatsApp.

## Critério de aceite
- [ ] Sessão persiste após primeiro login

## Sprint
Sprint 1

## Observações
Prioridade: Alta. Relação: RF02.
```

---

### Issue 1.4 – Criar fluxo de boas-vindas e menu (opções 1 a 5)

**Título:** `[Sprint 1] 1.4 Criar fluxo de boas-vindas e menu (opções 1 a 5)`

**Corpo:**

```markdown
## Descrição
Criar fluxo de boas-vindas e menu com opções 1 a 5.

## Critério de aceite
- [ ] Resposta a "oi"
- [ ] Resposta a "menu"
- [ ] Resposta às opções 1 a 5

## Sprint
Sprint 1

## Observações
Prioridade: Alta. Relação: RF03.
```

---

### Issue 1.5 – Documentar no README como rodar e escanear QR

**Título:** `[Sprint 1] 1.5 Documentar no README como rodar e escanear QR`

**Corpo:**

```markdown
## Descrição
Documentar no README os pré-requisitos e comandos para rodar o bot e escanear o QR Code.

## Critério de aceite
- [ ] README com pré-requisitos
- [ ] README com comandos para rodar e escanear QR

## Sprint
Sprint 1

## Observações
Prioridade: Média. Relação: RNF02.
```

---

## Sprint 2

### Issue 2.1 – Implementar textos oficiais (orientações, direitos, reclamação)

**Título:** `[Sprint 2] 2.1 Implementar textos oficiais (orientações, direitos, reclamação)`

**Corpo:**

```markdown
## Descrição
Implementar textos oficiais alinhados ao CDC e ao Procon para orientações, direitos e reclamação.

## Critério de aceite
- [ ] Respostas alinhadas ao CDC e ao Procon

## Sprint
Sprint 2

## Observações
Prioridade: Alta. Relação: RF04.
```

---

### Issue 2.2 – Incluir contato e endereço Procon Jacareí (configurável)

**Título:** `[Sprint 2] 2.2 Incluir contato e endereço Procon Jacareí (configurável)`

**Corpo:**

```markdown
## Descrição
Incluir contato e endereço do Procon Jacareí nas opções 3 e 4, de forma configurável.

## Critério de aceite
- [ ] Opção 3 e 4 com dados atualizáveis em MenuService

## Sprint
Sprint 2

## Observações
Prioridade: Alta. Relação: RF05.
```

---

### Issue 2.3 – Tratar mensagens não reconhecidas com resposta amigável

**Título:** `[Sprint 2] 2.3 Tratar mensagens não reconhecidas com resposta amigável`

**Corpo:**

```markdown
## Descrição
Tratar mensagens não reconhecidas com resposta amigável.

## Critério de aceite
- [ ] Resposta padrão sugere "menu" ou "início"

## Sprint
Sprint 2

## Observações
Prioridade: Média. Relação: RF06.
```

---

### Issue 2.4 – Implementar opção 6 – Agendamento (fluxo nome → motivo → data)

**Título:** `[Sprint 2] 2.4 Implementar opção 6 – Agendamento (fluxo nome → motivo → data)`

**Corpo:**

```markdown
## Descrição
Implementar opção 6 – Agendamento com fluxo nome → motivo → data e confirmação.

## Critério de aceite
- [ ] Fluxo completo com confirmação
- [ ] Dados persistidos em `data/agendamentos.json`

## Sprint
Sprint 2

## Observações
Prioridade: Alta. Relação: RF07.
```

---

### Issue 2.5 – Consentimento LGPD antes de coletar dados no agendamento

**Título:** `[Sprint 2] 2.5 Consentimento LGPD antes de coletar dados no agendamento`

**Corpo:**

```markdown
## Descrição
Obter consentimento LGPD antes de coletar dados no agendamento (SIM/NÃO).

## Critério de aceite
- [ ] Texto de consentimento exibido
- [ ] Usuário digita SIM ou NÃO
- [ ] Sem coleta de dados se NÃO

## Sprint
Sprint 2

## Observações
Prioridade: Alta. Relação: RF08.
```

---

### Issue 2.6 – Horários livres: listar slots e reservar ao confirmar

**Título:** `[Sprint 2] 2.6 Horários livres: listar slots disponíveis e reservar slot ao confirmar`

**Corpo:**

```markdown
## Descrição
Listar horários livres (slots de 30 min) e reservar slot ao confirmar agendamento.

## Critério de aceite
- [ ] Opção "Ver horários livres" disponível
- [ ] Slots de 30 min
- [ ] Ocupado/livre em agendamentos.json

## Sprint
Sprint 2

## Observações
Prioridade: Alta. Relação: RF09.
```

---

### Issue 2.7 – Revisar textos com foco em acessibilidade e clareza

**Título:** `[Sprint 2] 2.7 Revisar textos com foco em acessibilidade e clareza`

**Corpo:**

```markdown
## Descrição
Revisar textos do bot com foco em acessibilidade e clareza.

## Critério de aceite
- [ ] Textos curtos e objetivos

## Sprint
Sprint 2

## Observações
Prioridade: Média. Relação: RNF03.
```

---

### Issue 2.8 – (Opcional) Persistir sessão em ambiente de produção

**Título:** `[Sprint 2] 2.8 (Opcional) Persistir sessão em ambiente de produção`

**Corpo:**

```markdown
## Descrição
Persistir sessão em ambiente de produção com instruções ou código para deploy.

## Critério de aceite
- [ ] Instruções ou código para deploy

## Sprint
Sprint 2

## Observações
Prioridade: Baixa. Opcional. Relação: RNF04.
```

---

## Sprint 3

### Issue 3.1 – Painel do atendente: *atendente* / *historico* / *metricas*

**Título:** `[Sprint 3] 3.1 Painel do atendente: comando atendente / historico / metricas (ADMIN_NUMBER)`

**Corpo:**

```markdown
## Descrição
Implementar painel do atendente com comandos *atendente*, *historico* e *metricas* para ADMIN_NUMBER.

## Critério de aceite
- [ ] Resposta com histórico e métricas (total, hoje, 7 dias, por status)

## Sprint
Sprint 3

## Observações
Prioridade: Alta. Relação: RF10.
```

---

### Issue 3.2 – Métricas do protocolo: vira dado, vira processo, gestão pública

**Título:** `[Sprint 3] 3.2 Métricas do protocolo: vira dado, vira processo, gestão pública`

**Corpo:**

```markdown
## Descrição
Métricas do protocolo (vira dado, vira processo, gestão); comandos *processo [ID]* e *gestao [ID]* atualizam agendamento.

## Critério de aceite
- [ ] Contagem por eixo
- [ ] Comandos *processo [ID]* e *gestao [ID]* atualizam agendamento

## Sprint
Sprint 3

## Observações
Prioridade: Alta. Relação: RF11.
```

---

### Issue 3.3 – Tratamento de erros e logs

**Título:** `[Sprint 3] 3.3 Tratamento de erros e logs (falha de conexão, auth)`

**Corpo:**

```markdown
## Descrição
Tratamento de erros e logs para falha de conexão e autenticação.

## Critério de aceite
- [ ] Erros logados
- [ ] Mensagem amigável ao usuário quando aplicável

## Sprint
Sprint 3

## Observações
Prioridade: Alta. Relação: RNF05.
```

---

### Issue 3.4 – Documentação: README, arquitetura e variáveis de ambiente

**Título:** `[Sprint 3] 3.4 Documentação: README, arquitetura e variáveis de ambiente`

**Corpo:**

```markdown
## Descrição
Documentação: README completo, arquitetura e variáveis de ambiente.

## Critério de aceite
- [ ] README completo
- [ ] Doc de arquitetura (docs/ARQUITETURA.md)
- [ ] Variáveis de ambiente documentadas

## Sprint
Sprint 3

## Observações
Prioridade: Alta. Relação: RNF06.
```

---

### Issue 3.5 – Guia de deploy (servidor/VPS ou Docker)

**Título:** `[Sprint 3] 3.5 Guia de deploy (ex.: servidor/VPS ou Docker)`

**Corpo:**

```markdown
## Descrição
Guia de deploy para colocar o bot em produção (servidor/VPS ou Docker).

## Critério de aceite
- [ ] Passo a passo para colocar em produção (ex.: docs/PASSO-A-PASSO.md)

## Sprint
Sprint 3

## Observações
Prioridade: Média. Relação: RNF07.
```

---

### Issue 3.6 – Checklist de segurança (.env, sessão não commitada)

**Título:** `[Sprint 3] 3.6 Checklist de segurança (.env, sessão não commitada)`

**Corpo:**

```markdown
## Descrição
Checklist de segurança: não expor .env nem sessão no repositório.

## Critério de aceite
- [ ] .env e data/ no .gitignore
- [ ] Orientações no README

## Sprint
Sprint 3

## Observações
Prioridade: Alta. Relação: RNF08.
```

---

### Issue 3.7 – (Opcional) Integração Outlook ao confirmar agendamento

**Título:** `[Sprint 3] 3.7 (Opcional) Integração Outlook: criar evento no calendário ao confirmar agendamento`

**Corpo:**

```markdown
## Descrição
Integração opcional com Outlook: criar evento no calendário ao confirmar agendamento.

## Critério de aceite
- [ ] Variáveis Microsoft Graph configuradas
- [ ] Evento criado conforme docs/OUTLOOK-AGENDAMENTO.md

## Sprint
Sprint 3

## Observações
Prioridade: Baixa. Opcional. Relação: RF12.
```

---

### Issue 3.8 – Atualizar Projects/Kanban com status final das tarefas

**Título:** `[Sprint 3] 3.8 Atualizar Projects/Kanban com status final das tarefas`

**Corpo:**

```markdown
## Descrição
Atualizar Projects/Kanban com status final das tarefas do Sprint 3.

## Critério de aceite
- [ ] Todas as issues do Sprint 3 em Done

## Sprint
Sprint 3

## Observações
Prioridade: Média. Relação: RNF09.
```

---

### Issue 3.9 – Integrar Groq para dúvidas em texto livre

**Título:** `[Sprint 3] 3.9 Integrar Groq para dúvidas em texto livre (contexto CDC/Procon)`

**Corpo:**

```markdown
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
```

---

## Resumo

| Sprint | Issues |
|--------|--------|
| Sprint 1 | 1.1, 1.2, 1.3, 1.4, 1.5 |
| Sprint 2 | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8 |
| Sprint 3 | 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9 |

**Total:** 22 issues.

Ao criar cada issue no GitHub, use o template **Tarefa Kanban** e associe ao **milestone** do sprint correspondente (Sprint 1, Sprint 2 ou Sprint 3).
