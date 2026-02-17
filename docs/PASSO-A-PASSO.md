# Passo a passo – Bot Procon Jacareí WhatsApp

Guia em ordem para deixar o bot funcionando do zero até o primeiro atendimento no WhatsApp.

---

## Parte 1 – Antes de começar

### Passo 1 – Verificar Node.js

1. Abra o **terminal** (PowerShell, CMD ou terminal do Cursor).
2. Digite:
   ```bash
   node -v
   ```
3. A versão deve ser **18** ou superior (ex.: `v20.10.0`).
4. Se não tiver Node.js ou for antigo, baixe em: https://nodejs.org (versão LTS).
5. Depois de instalar, feche e abra o terminal de novo e confira de novo com `node -v`.

### Passo 2 – Ter o projeto na sua máquina

1. Se ainda não tiver o projeto:
   - Clone o repositório (ex.: `git clone <url-do-repositorio>`) **ou**
   - Copie a pasta do projeto para o seu PC.
2. Abra o terminal **dentro da pasta do projeto** (onde está o arquivo `package.json`).
3. Exemplo no Windows (PowerShell):
   ```bash
   cd "C:\Área de Trabalho\Repositórios\ABP6"
   ```
   (Ajuste o caminho se a pasta estiver em outro lugar.)

### Passo 3 – Ter um WhatsApp para o bot

1. Use um **número de celular** com WhatsApp instalado.
2. Recomendado: número **institucional** do Procon (não o pessoal).
3. Esse número será o “dono” do bot: as pessoas vão falar com esse número no WhatsApp.

---

## Parte 2 – Instalar e compilar

### Passo 4 – Instalar dependências

1. No terminal, ainda **dentro da pasta do projeto**, rode:
   ```bash
   npm install
   ```
2. Aguarde terminar (pode demorar um pouco na primeira vez).
3. Não deve aparecer erro em vermelho; se aparecer, confira se está na pasta certa e se o Node é 18+.

### Passo 5 – Compilar o TypeScript (build)

1. No mesmo terminal, rode:
   ```bash
   npm run build
   ```
2. Deve ser criada a pasta `dist/` com os arquivos em JavaScript.
3. Se der erro, leia a mensagem (geralmente é problema de versão do Node ou pasta errada).

---

## Parte 3 – Conectar o bot ao WhatsApp

### Passo 6 – Iniciar o bot

1. No terminal, rode:
   ```bash
   npm start
   ```
   Ou, para desenvolvimento com reload automático:
   ```bash
   npm run dev
   ```
2. Na primeira vez, o bot vai abrir a conexão com o WhatsApp e em alguns segundos deve aparecer um **QR Code** no terminal.

### Passo 7 – Escanear o QR Code no celular

1. Pegue o **celular** com o WhatsApp que será usado pelo bot.
2. Abra o **WhatsApp**.
3. Toque nos **três pontinhos** (menu) ou em **Configurações**.
4. Vá em **Aparelhos conectados**.
5. Toque em **Conectar um aparelho**.
6. **Escaneie o QR Code** que está no terminal do computador.
7. Aguarde conectar. No terminal deve aparecer algo como: `Bot Procon Jacareí conectado e pronto!`

### Passo 8 – Manter o terminal aberto

1. **Não feche** o terminal enquanto quiser o bot ativo.
2. Se fechar, o bot para. Para usar de novo, rode de novo `npm start` (ou `npm run dev`).
3. Depois da primeira conexão, a sessão fica salva na pasta `.wwebjs_auth`. Nas próximas vezes o bot pode iniciar **sem** mostrar QR Code de novo (até a sessão expirar ou ser desconectada no WhatsApp).

---

## Parte 4 – Testar o atendimento

### Passo 9 – Enviar mensagem para o número do bot

1. Em **outro celular** (ou outro número), abra o WhatsApp.
2. Inicie uma conversa com o **número que está conectado ao bot** (o que você escaneou no passo 7).
3. Envie: **oi** ou **menu**.
4. O bot deve responder com o menu do Procon (opções 1 a 5).

### Passo 10 – Testar as opções

1. Envie **1** – deve vir orientações ao consumidor.
2. Envie **2** – como registrar reclamação.
3. Envie **3** – contato e endereço.
4. Envie **4** – horário de atendimento.
5. Envie **5** – direitos básicos do consumidor.
6. Envie **menu** de novo – deve mostrar o menu outra vez.

Se todas as respostas aparecerem corretamente, o passo a passo foi concluído com sucesso.

---

## Parte 5 – Ajustes opcionais

### Passo 11 – Atualizar contato e horário do Procon

1. Abra no editor o arquivo: `src/services/MenuService.ts`.
2. Nos métodos **getContato()** e **getHorario()**, troque os textos pelos dados oficiais do Procon de Jacareí (endereço, telefone, site, horário).
3. Salve o arquivo.
4. Se estiver usando `npm run dev`, o bot pode reiniciar sozinho; se estiver com `npm start`, pare o bot (Ctrl+C) e rode `npm run build` e depois `npm start` de novo.

### Passo 12 – Rodar em servidor (produção)

1. No servidor, instale Node.js 18+.
2. Copie a pasta do projeto (incluindo `node_modules` ou rode `npm install` no servidor).
3. **Primeira vez no servidor:** você precisará ver o QR Code (por SSH com suporte a interface, ou rodando uma vez na sua máquina e copiando a pasta `.wwebjs_auth` para o servidor – com cuidado para não expor essa pasta).
4. Use **pm2** ou **systemd** para manter o bot rodando e reiniciar em caso de queda (ex.: `pm2 start dist/index.js --name procon-bot`).

---

## Resumo dos comandos (em ordem)

| Ordem | Comando        | O que faz                    |
|-------|----------------|------------------------------|
| 1     | `node -v`      | Verifica se Node 18+ está instalado |
| 2     | `cd pasta-do-projeto` | Entra na pasta do projeto    |
| 3     | `npm install`  | Instala dependências         |
| 4     | `npm run build`| Compila o TypeScript         |
| 5     | `npm start`    | Inicia o bot (mostra QR na 1ª vez)  |
| 6     | Escanear QR no WhatsApp | Conecta o número ao bot      |

Depois da primeira conexão, para usar de novo: abrir o terminal na pasta do projeto e rodar `npm start` (ou `npm run dev`).

---

## Problemas comuns

| Problema | O que fazer |
|----------|-------------|
| `node` não é reconhecido | Instalar Node.js (nodejs.org) e reiniciar o terminal. |
| Erro no `npm install` | Verificar se está na pasta que contém `package.json`. |
| QR Code não aparece | Aguardar alguns segundos; verificar internet; tentar `npm start` de novo. |
| Bot não responde | Confirmar que o número que recebe a mensagem é o que foi conectado ao bot; conferir se o terminal ainda está rodando. |
| Sessão caiu / pede QR de novo | Escanear o QR Code de novo; não apagar a pasta `.wwebjs_auth` sem necessidade. |

Para mais detalhes sobre API, ambiente e segurança: [Requisitos da API e mais](REQUISITOS-API-E-MAIS.md).
