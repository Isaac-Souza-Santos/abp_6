import type { ProconBot } from '../bot/ProconBot';
import type { Agendamento } from '../types/agendamento';
import type { AgendaLembreteConfirmacaoConfig } from '../types/agendaLembreteConfirmacao';
import { AgendamentoStore } from './AgendamentoStore';
import { agendaLembreteConfirmacaoStore } from './AgendaLembreteConfirmacaoStore';
import { MenuService } from './MenuService';
import { registrarPendenteRespostaLembrete } from './lembreteConfirmacaoRespostaPendente';

const menuService = new MenuService();

function formatDataHoraAg(ag: Agendamento): string {
  if (ag.slotInicio) {
    try {
      return new Date(ag.slotInicio).toLocaleString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ag.dataPreferida;
    }
  }
  return ag.dataPreferida;
}

export function expandirTemplateLembrete(cfg: AgendaLembreteConfirmacaoConfig, ag: Agendamento): string {
  const map: Record<string, string> = {
    nome: ag.nome,
    dataHora: formatDataHoraAg(ag),
    motivo: ag.motivo,
    protocolo: ag.id,
    guiche: ag.atendenteNome?.trim() || '—',
    endereco: menuService.getEnderecoProcon(),
  };
  let out = cfg.mensagemTemplate;
  for (const [key, val] of Object.entries(map)) {
    out = out.split(`{${key}}`).join(val);
  }
  return out;
}

/**
 * Envia lembretes pendentes: janela [slot - antecedenciaDias, slot), agendamento ativo, com slot, ainda não enviado.
 */
export async function processarLembretesConfirmacao(bot: ProconBot, store: AgendamentoStore): Promise<void> {
  const cfg = agendaLembreteConfirmacaoStore.getConfig();
  if (!cfg.ativo || !bot.isReady()) return;

  const advanceMs = cfg.antecedenciaDias * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const list = store.listarTodos();
  for (const ag of list) {
    if (!ag.slotInicio) continue;
    if (ag.status === 'cancelado' || ag.status === 'atendido' || ag.status === 'confirmado') continue;
    if (ag.lembreteConfirmacaoEnviadoEm) continue;

    const slotMs = new Date(ag.slotInicio).getTime();
    if (Number.isNaN(slotMs)) continue;
    if (now < slotMs - advanceMs) continue;
    if (now >= slotMs) continue;

    const texto = expandirTemplateLembrete(cfg, ag);
    const result = await bot.sendWhatsAppText(ag.telefone, texto);
    if (result.ok) {
      store.update(ag.id, { lembreteConfirmacaoEnviadoEm: new Date().toISOString() });
      const expiraResposta = slotMs + 2 * 60 * 60 * 1000;
      registrarPendenteRespostaLembrete(ag.telefone, ag.id, expiraResposta);
      console.log(`[Lembrete] Enviado para ${ag.id} (${ag.nome})`);
    } else {
      console.warn(`[Lembrete] Falha ao enviar ${ag.id}:`, result.error);
    }
  }
}

export function iniciarAgendadorLembreteConfirmacao(bot: ProconBot, store: AgendamentoStore): void {
  const intervaloMs = Number(process.env.LEMBRETE_CONFIRMACAO_INTERVALO_MS || 10 * 60 * 1000);

  const tick = (): void => {
    void processarLembretesConfirmacao(bot, store).catch((e) => {
      console.error('[Lembrete] Erro no processamento:', e);
    });
  };

  setTimeout(tick, 60_000);
  setInterval(tick, intervaloMs);
}
