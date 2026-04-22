# Documento: testes automatizados realizados xx

Este texto descreve, em linguagem corrida, **quais verificações automatizadas existem no projeto**, **o que cada uma prova** e **como repetir a execução**. Não substitui o código dos testes: ele serve como mapa para quem revisa qualidade ou integração contínua.

## Resumo executivo

O backend do bot (pasta `src/`) usa **Jest** com **TypeScript** (`ts-jest`), ambiente **Node**. Hoje há **6 arquivos** de suíte e **25 casos** de teste (`test` / `it`). O aplicativo **painel-interno** não possui suíte de testes configurada no `package.json`.

Uma execução bem-sucedida de `npm test` na raiz termina com **6 suites passando** e **25 testes passando** (sem snapshots). A pasta `dist/` é ignorada pelo Jest para não duplicar suítes após `npm run build`.

## Como executar os testes

Na raiz do repositório:

```bash
npm test
```

Modo contínuo (útil no desenvolvimento):

```bash
npm run test:watch
```

Cobertura de código (Istanbul via Jest):

```bash
npm run test:coverage
```

Requisito: **Node.js ≥ 18**.

## Configuração relevante

No `package.json` da raiz, o bloco `jest` define:

- `preset`: `ts-jest`
- `testEnvironment`: `node`
- `testPathIgnorePatterns`: exclui `dist/`, evitando rodar `*.test.js` compilados em paralelo aos `*.test.ts`

O **lint** (ESLint) é independente: `npm run lint` na raiz e `npm --prefix painel-interno run lint` no painel.

---

## Relatório dos testes realizados (por módulo)

Abaixo está o **inventário** do que cada suíte **verifica de fato**. Os títulos entre aspas reproduzem os nomes dos casos no código.

### 1. `src/services/agendaSlotUtils.test.ts` (5 casos)

Funções puras de agenda: cruzamento com almoço, geração de slots do dia e limites de bloco.

1. **slot before lunch does not cross** — um slot inteiramente antes do almoço não é marcado como cruzando o intervalo de almoço.
2. **slot overlapping lunch start crosses** — um slot que encosta no início do almoço é tratado como cruzamento.
3. **slot inside lunch crosses** — slot no meio do horário de almoço cruza o almoço.
4. **removes slots that overlap lunch** — `slotsDoAtendenteNoDia` mantém, por exemplo, 11:30 e remove 11:45 quando esse slot sobrepõe o almoço configurado.
5. **respects end boundary** — `horariosEmBloco` não gera horário após o fim do bloco (ex.: bloco até 12:00 com intervalo de 60 minutos).

### 2. `src/services/MenuService.test.ts` (5 casos)

Garante que os textos fixos do menu contêm trechos esperados (marca, opções e mensagens de apoio).

1. **getWelcome returns menu text with options** — boas-vindas com “Procon Jacareí”, opção 1 e lembrete do comando `menu`.
2. **getQualSuaDuvida matches initial welcome text** — “qual sua dúvida” alinhada ao texto inicial de boas-vindas.
3. **getOrientacoesEDireitos returns consumer guidance** — conteúdo de orientações ao consumidor (ex.: troca ou devolução).
4. **getReclamacao returns complaint registration info** — texto sobre documentos e nota fiscal.
5. **getContato returns contact info** — texto de contato contém “Contato”.

### 3. `src/services/AgendamentoService.test.ts` (4 casos)

Fluxo textual de agendamento e integração superficial com a camada de persistência em memória/arquivo.

1. **getTextoInicio returns start text** — início do fluxo cita o tema do agendamento e a opção de cancelar.
2. **getTextoConsentimento returns consent text** — texto de consentimento com opções numéricas (ex.: _1_ - Sim).
3. **getProximosSlotsLivres returns slots** — retorno é array; se houver itens, possuem `label` e `dataHora`.
4. **getStore returns AgendamentoStore instance** — `getStore` devolve objeto com `listarTodos` como função.

### 4. `src/handlers/MessageHandler.test.ts` (6 casos)

Comportamento do roteador de mensagens com **mocks**: cliente WhatsApp simulado e **Groq desligado** (`estaDisponivel` falso), para não depender de rede nem de API externa.

1. **ignores group messages** — em chat de grupo, `reply` não é chamado.
2. **handles menu command** — corpo `menu` aciona `getWelcome` do `MenuService`.
3. **handles option 1** — corpo `1` aciona `getOrientacoesEDireitos`.
4. **handles greeting as first message** — saudação simples (`oi!`) aciona `getQualSuaDuvida`.
5. **handles extended greeting text** — mensagem mais longa de saudação também segue o fluxo de dúvida inicial.
6. **handles eai as greeting (not LLM)** — “eai” tratado como saudação, mesmo caminho de `getQualSuaDuvida`.

### 5. `src/bot/chromiumProfileLocks.test.ts` (4 casos)

Limpeza de arquivos de lock do perfil Chromium em disco temporário (isolado por `beforeEach` / `afterEach`).

1. **remove SingletonLock e DevToolsActivePort na raiz do perfil** — arquivos na raiz do perfil são removidos e a função reporta remoções.
2. **remove locks em Default/** — lock dentro de `Default/` é removido.
3. **retorna 0 se diretório não existe** — caminho inexistente não quebra e retorna zero remoções.
4. **remove SingletonLock em subpasta (não listada em SKIP_DIRS)** — subpastas genéricas também têm lock removido quando aplicável.

### 6. `src/bot/ProconBot.test.ts` (1 caso)

Fumaça mínima da classe do bot.

1. **initializes client with events** — apenas assegura que a instância de `ProconBot` existe após construção; o arquivo sugere ampliar para fluxos reais (menu → respostas).

---

## Lacunas conhecidas (não coberto por estes testes)

- **Painel React (`painel-interno`):** sem `npm test` nem arquivos de teste integrados ao fluxo atual.
- **Agendamento completo:** por exemplo confirmação e persistência final (`confirmarESalvar`) não têm casos dedicados aqui.
- **Admin, LLM em produção, sessão WhatsApp real:** exigiriam mocks adicionais ou testes e2e.

---

_Documento voltado ao estado atual das suítes em `src/\*\*/_.test.ts`. Para números exatos após mudanças no código, rode `npm test` na raiz.\*
