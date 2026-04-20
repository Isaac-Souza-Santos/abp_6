# Configuração Azure (repositório)

Os **guias completos** de configuração e arquitetura Azure **não são versionados** neste Git (podem conter nomes de recursos, subscription, passos específicos de ambiente).

## Onde manter a documentação

1. Copie ou crie ficheiros **apenas na tua máquina**, na pasta `local/` (ignorada pelo Git), por exemplo:
   - `local/PAINEL-AZURE-SWA.md` — Static Web Apps + painel  
   - `local/PAINEL-AZURE-APP-SERVICE.md` — App Service (plano B)  
   - `local/ARQUITETURA-AZURE.md` — arquitetura ACA / ACR / Key Vault  
   - `local/azure-contexto.txt` — IDs e URLs (ver `local/azure-contexto.EXEMPLO.txt`)

2. Partilhe esses ficheiros pela equipa por **canal privado** (não pelo repositório público).

## O que continua no repositório

- Scripts em `infra/azure/*.ps1`, `*.sh`, `*.mjs`  
- Workflows em `.github/workflows/` (referências a `${{ secrets.* }}`, sem valores)  
- Código (`src/index.ts`, painel, etc.)

Para detalhes técnicos genéricos do bot (sem inventário Azure), use `documentacao/ARQUITETURA.md` e `infra/azure/` conforme os scripts.
