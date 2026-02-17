# Métricas sobre os protocolos: vira dado, vira processo, gestão pública

As métricas do painel do atendente acompanham o **ciclo do protocolo** em três eixos que alimentam a gestão pública:

## Os três eixos

| Eixo | Significado | Como é contado |
|------|-------------|----------------|
| **✅ Vira dado** | Protocolo registrado no sistema (entrou como dado) | Total de agendamentos salvos. Todo agendamento confirmado vira dado. |
| **✅ Vira processo** | Protocolo que virou processo formal | Quantidade de protocolos marcados pelo atendente como “virou processo”. |
| **✅ Gestão pública** | Protocolo utilizado na gestão / indicadores | Quantidade de protocolos marcados pelo atendente como “gestão pública”. |

Assim, o fluxo **protocolo → vira dado → vira processo → gestão pública** vira base para indicadores e tomada de decisão.

## Como marcar no WhatsApp (atendente)

Quem usa o número configurado em `ADMIN_NUMBER` pode:

1. Enviar **atendente** (ou **historico** / **metricas**) para ver o painel com as métricas e a lista de protocolos (com ID).
2. Marcar um protocolo como **virou processo**:  
   `processo ag-1234567890-abc123`  
   (use o ID exatamente como aparece no histórico.)
3. Marcar um protocolo como **gestão pública**:  
   `gestao ag-1234567890-abc123`  
   (ou `gestão ag-...`.)

O painel mostra, para cada protocolo, se já está marcado como processo e/ou gestão.

## Onde os dados ficam

- Os campos **virouProcesso** e **gestaoPublica** são opcionais em cada agendamento em `data/agendamentos.json`.
- As métricas (vira dado, vira processo, gestão pública) são calculadas a partir desses registros e exibidas no painel do atendente.

## Uso para gestão

- **Vira dado:** volume de demanda registrada (base de dados de atendimento).
- **Vira processo:** quantos casos viraram processo formal (ex.: abertura de processo administrativo ou jurídico).
- **Gestão pública:** quantos protocolos foram considerados para relatórios, indicadores e planejamento (gestão pública).

Isso permite acompanhar não só o volume de atendimentos, mas também o desdobramento em processos e o uso dos dados para gestão.
