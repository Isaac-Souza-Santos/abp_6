# O que você precisa para a API e mais

Documento com **requisitos para usar a API de WhatsApp** do projeto e **informações extras** (ambiente, segurança, alternativas e evolução).

---

## 1. O que precisa para a API (whatsapp-web.js)

Esta API é **gratuita** e não exige chave paga ou cadastro em portal do Meta.

### 1.1 Requisitos de máquina e software

| Item | Exigência |
|------|-----------|
| **Node.js** | Versão 18 ou superior |
| **npm** (ou yarn/pnpm) | Para instalar dependências |
| **Conta WhatsApp** | Número de celular com WhatsApp (recomendado: número institucional do Procon) |
| **Conexão internet** | Estável; o bot usa WhatsApp Web (multidevice) |
| **Espaço em disco** | Alguns MB para `node_modules` + pasta de sessão `.wwebjs_auth` |
| **Chrome/Chromium** | Usado em background pelo Puppeteer (já vem com a lib) |

### 1.2 O que a API **não** exige

- Não precisa de **API Key** paga.
- Não precisa cadastrar no **Meta Business** ou **WhatsApp Business API** oficial.
- Não precisa de **cartão de crédito** ou contrato com Meta.

### 1.3 Primeira vez (conexão)

1. **Instalar dependências** (manual): `npm install`
2. **Rodar o bot** (manual): `npm run dev` ou `npm start`
3. **QR Code** aparece no terminal.
4. No celular: WhatsApp → **Aparelhos conectados** → **Conectar um aparelho** → escanear o QR.
5. A sessão é salva em `.wwebjs_auth`; nas próximas vezes o bot pode iniciar sem novo QR (enquanto a sessão for válida).

### 1.4 Limitações importantes

- **Termos do WhatsApp:** Bots não oficiais podem violar os termos de uso; use preferencialmente conta institucional e para fins de atendimento público.
- **Risco de bloqueio:** Uso abusivo (spam, muitos números) pode levar ao bloqueio do número.
- **Um número por sessão:** Cada instância do bot usa um número; para vários números é preciso várias instâncias ou outra solução (ex.: Evolution API).

---

## 2. Alternativa: Evolution API

Se no futuro quiser **API REST** (webhooks, múltiplas instâncias, integração com outros sistemas):

| Aspecto | whatsapp-web.js (atual) | Evolution API |
|---------|-------------------------|---------------|
| **Custo** | Gratuito | Gratuito (self-hosted) |
| **Forma de uso** | Biblioteca dentro do seu Node/TS | Serviço separado (Docker) que expõe REST + webhooks |
| **Requisitos extras** | Nenhum | Docker, servidor para rodar a API |
| **Múltiplos números** | Uma instância por número | Várias instâncias via API |
| **Integração** | Código direto no bot | Seu bot chama HTTP e recebe webhooks |

**O que precisa para Evolution API:**

- Servidor (VPS, cloud ou máquina com Docker).
- Docker e Docker Compose.
- Seguir a documentação oficial: [Evolution API](https://github.com/EvolutionAPI/evolution-api).
- Ajustar o bot para enviar/receber mensagens via HTTP em vez de usar whatsapp-web.js direto.

O projeto atual **não depende** da Evolution; é uma opção de evolução futura.

---

## 3. Ambiente (desenvolvimento e produção)

### 3.1 Desenvolvimento (seu PC)

- Node 18+, npm instalados.
- Terminal com acesso à pasta do projeto para ver o QR Code.
- Celular com o WhatsApp que será usado pelo bot (para escanear o QR).

### 3.2 Produção (servidor)

- **Servidor** (Linux recomendado) com Node 18+ ou container (Docker) com Node.
- **Processo sempre rodando:** use `pm2`, `systemd` ou similar para manter o bot ativo e reiniciar em caso de queda.
- **Rede:** porta de saída liberada (o bot não precisa abrir porta de entrada para o WhatsApp).
- **Primeira conexão no servidor:** você precisará ver o QR Code uma vez (SSH com X11, VNC, ou rodar localmente e depois copiar a pasta `.wwebjs_auth` para o servidor com cuidado de segurança).

---

## 4. Segurança e o que não expor

### 4.1 Não commitar no Git

- `.wwebjs_auth/` – sessão do WhatsApp (equivale à “senha” da sessão).
- `.env` – variáveis de ambiente (se usar no futuro).
- `node_modules/` – já costuma estar no `.gitignore`.

O `.gitignore` do projeto já inclui `.wwebjs_auth` e `.env`.

### 4.2 Boas práticas

- Usar **número institucional** do Procon, não pessoal.
- Em servidor, restringir acesso à pasta do projeto e à pasta de sessão (permissões de usuário).
- Se no futuro houver backend com dados de cidadãos, usar HTTPS, env vars e nunca logar dados sensíveis em claro.

---

## 5. Conteúdo e manutenção (Procon)

### 5.1 Onde alterar textos

- **Menu e respostas:** `src/services/MenuService.ts`
- Atualize **contato**, **endereço**, **telefone** e **horário** com dados oficiais da Prefeitura de Jacareí (Procon).

### 5.2 Dados que você deve preencher

- Endereço do Procon Jacareí.
- Telefone(s) de atendimento.
- Site oficial (ex.: página do Procon no site da Prefeitura).
- Horário de atendimento presencial (se aplicável).

Isso evita informação desatualizada no bot.

---

## 6. Resumo rápido

| O que | Resposta |
|-------|----------|
| **API paga?** | Não. whatsapp-web.js é gratuita. |
| **Preciso de API Key?** | Não. |
| **Preciso de quê para rodar?** | Node 18+, npm, conta WhatsApp, escanear QR na primeira vez. |
| **Posso usar em produção?** | Sim, com servidor ou container e processo gerenciado (pm2/systemd). |
| **E se quiser API REST?** | Considerar Evolution API (gratuita, self-hosted, Docker). |
| **O que não colocar no Git?** | `.wwebjs_auth`, `.env`, `node_modules`. |
| **Onde mudar contato/horário?** | `src/services/MenuService.ts`. |

---

## 7. Referências

- [whatsapp-web.js – GitHub](https://github.com/pedroslopez/whatsapp-web.js)
- [Evolution API – GitHub](https://github.com/EvolutionAPI/evolution-api)
- [CDC – Lei 8.078/90](https://www.planalto.gov.br/ccivil_03/leis/l8078.htm) (direitos do consumidor)
