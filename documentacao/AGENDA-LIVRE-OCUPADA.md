# Gerenciamento da agenda: livre x ocupada

O agendamento do bot permite ao cidadão **ver horários livres** (agenda disponível) ou **informar uma data preferida**. O sistema controla o que está **livre** e **ocupado** para evitar marcações no mesmo horário.

## Como o cidadão agenda

No passo *Data preferida*, o usuário escolhe:

1. **Opção 1 – Ver horários livres**  
   O bot lista os próximos horários **disponíveis** (até 12 opções), em ordem de data/hora. O cidadão digita o **número** do horário desejado (ex.: 3). Esse horário fica **reservado** para ele ao confirmar.

2. **Opção 2 – Informar data preferida**  
   O cidadão digita texto livre (ex.: 15/03/2025 ou "o mais cedo possível"). Não há checagem de conflito; a equipe pode ajustar depois. Útil quando não há slots listados ou quando a pessoa prefere sugerir a data.

## Como é definido "livre" e "ocupado"

- **Horário de atendimento:** de segunda a sexta, manhã 9h–12h e tarde 14h–17h, em slots de **30 minutos** (9h, 9h30, 10h, 10h30, etc.).
- **Ocupado:** todo agendamento salvo com um **slot** (escolhido da lista de horários livres) e que **não** está com status *cancelado*.
- **Livre:** slots que não têm nenhum agendamento ocupando naquele dia/hora.

Ou seja: a "agenda" é gerenciada pelos próprios agendamentos. Quando alguém escolhe um horário da lista (opção 1) e confirma, aquele slot passa a ser considerado **ocupado** para as próximas consultas de "horários livres".

## Onde isso é guardado

- Os agendamentos (e o campo **slotInicio**, quando existe) ficam em **`data/agendamentos.json`**.
- O método **getSlotsOcupados** no `AgendamentoStore` usa esses dados para saber quais horários já estão ocupados.
- O **AgendamentoService** gera os próximos dias úteis, monta os slots de 30 min, remove os ocupados e devolve a lista de **horários livres** para exibir no WhatsApp.

## Resumo

| O que              | Onde é visto / como funciona |
|--------------------|-----------------------------|
| **Agenda livre**   | Lista "Horários livres" na opção 1 do agendamento (horários ainda sem agendamento confirmado). |
| **Agenda ocupada**| Slots que já têm agendamento (não cancelado) com **slotInicio** preenchido. |
| **Gerenciamento** | Automático: cada confirmação com horário da lista reserva aquele slot; cancelamentos liberam o slot de novo. |

Se o Procon usar também o **Outlook**, os eventos criados lá espelham os agendamentos (incluindo o horário quando vier de "horários livres"), mas a regra de **livre/ocupado** no bot é feita só com os dados em `data/agendamentos.json`.
