# Sprint 2 – Painel interno (tarefas)

Planeamento complementar para evolução do **painel web** (`painel-interno/`). Critérios objetivos para copiar ao GitHub Projects / Kanban.

**Pré-requisitos:** API do bot em execução (`npm run dev`), variáveis `ADMIN_PANEL_*` e `VITE_*` alinhadas ao [README do painel](../painel-interno/README.md).

---

## Objetivo da sprint

Consolidar o painel como ferramenta operacional: configuração visível da agenda (almoço por linha), documentação clara, segurança nas chamadas admin e melhorias de uso para o atendente.

---

## Tarefas

| ID   | Tarefa | Prioridade | Critério de aceite |
|------|--------|------------|-------------------|
| P2.1 | Documentar no README raiz os ficheiros em `data/` e o endpoint `GET/PUT /admin/agenda-atendentes` | Alta | README descreve `agenda-atendentes.json`, `agendamentos.json` e autenticação admin |
| P2.2 | Atualizar README do painel: fluxos reais (abas Agendamentos, Ajustes, Métricas) e que Ajustes inclui edição de almoço | Alta | `painel-interno/README.md` reflete comportamento atual (não só leitura) |
| P2.3 | Checklist de testes manuais: login (token e/ou Azure), listar agendamentos, guardar almoço, PATCH protocolo | Alta | Documento ou secção com passos reproduzíveis e resultado esperado |
| P2.4 | Tratamento de erro de rede na secção de almoço (retry, mensagem clara, estado após falha) | Média | Utilizador vê mensagem útil; botão "Tentar de novo" ou equivalente funciona |
| P2.5 | Validação client-side antes do PUT (almoço: início antes do fim; horas 0–23) | Média | PUT não é enviado com intervalo inválido; mensagem inline |
| P2.6 | Exibir no card de agendamento (aba consulta e ajustes) resumo consistente de data/hora + linha | Média | Protocolos com `atendenteNome` / `slotInicio` legíveis sem abrir consola |
| P2.7 | Gestão de várias linhas de atendimento no painel (adicionar/remover linha com nome e id seguros) | Baixa | API aceita config; UI permite N linhas sem editar JSON à mão |
| P2.8 | Exportar lista filtrada de agendamentos (CSV ou JSON) a partir do painel | Baixa | Ficheiro descarregável com colunas mínimas (id, data, status, telefone) |
| P2.9 | Revisão de acessibilidade (labels, `aria-*`, contraste nas abas e formulários) | Média | Navegação por teclado nas abas e nos controlos de almoço sem armadilhas óbvias |
| P2.10 | Alinhar `documentacao/AGENDA-LIVRE-OCUPADA.md` com modelo multi-linha + almoço + `atendenteId` | Média | Documento descreve ocupação por linha e exclusão de slots no almoço |

---

## Definição de pronto (DoD)

- Alterações no painel passam em `npm --prefix painel-interno run build`.
- Alterações na API passam em `npm run build` e testes relevantes (`npm test`).
- Nenhum segredo ou token commitado; apenas exemplos em `.env.example` se existir.

---

## Referências

- [README principal](../README.md)
- [README do painel](../painel-interno/README.md)
- [Backlog geral](../.github/BACKLOG.md)
- [Agenda livre x ocupada](AGENDA-LIVRE-OCUPADA.md)
