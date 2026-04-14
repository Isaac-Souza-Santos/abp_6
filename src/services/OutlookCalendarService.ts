/**
 * Integração gratuita com Outlook via Microsoft Graph API.
 * Cria evento no calendário quando um agendamento é confirmado.
 * Requer app no Azure (gratuito) e refresh token do calendário do Procon.
 */
import type { Agendamento } from '../types/agendamento';

const TENANT = process.env.OUTLOOK_TENANT_ID || 'common';
const CLIENT_ID = process.env.OUTLOOK_CLIENT_ID || '';
const CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.OUTLOOK_REFRESH_TOKEN || '';
const TIMEZONE = process.env.OUTLOOK_TIMEZONE || 'E. South America Standard Time';

function isConfigOk(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN);
}

/** Converte data preferida (texto) em início/fim para o evento. */
function parseDataPreferida(dataPreferida: string): { start: Date; end: Date } {
  const now = new Date();
  // Tenta DD/MM/AAAA ou DD-MM-AAAA
  const match = dataPreferida.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  let start: Date;
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10) < 100 ? 2000 + parseInt(match[3], 10) : parseInt(match[3], 10);
    start = new Date(year, month, day, 9, 0, 0);
  } else {
    // "o mais cedo possível" ou texto livre: amanhã 9h
    start = new Date(now);
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);
  }
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);
  return { start, end };
}

function toGraphDateTime(d: Date): string {
  return d.toISOString().slice(0, 19);
}

async function getAccessToken(): Promise<string | null> {
  if (!isConfigOk()) return null;
  try {
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: 'refresh_token',
    });
    const res = await fetch(`https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) {
      console.error('[Outlook] Erro ao obter token:', res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { access_token?: string };
    return data.access_token || null;
  } catch (e) {
    console.error('[Outlook] Erro getAccessToken:', e);
    return null;
  }
}

/**
 * Cria um evento no calendário Outlook do usuário cujo refresh token está configurado.
 * Não bloqueia: falhas são apenas logadas.
 * Se o agendamento tiver slotInicio (escolhido da lista de horários livres), usa esse horário; senão usa dataPreferida.
 */
export async function criarEventoOutlook(ag: Agendamento): Promise<void> {
  if (!isConfigOk()) return;
  const token = await getAccessToken();
  if (!token) return;

  let start: Date;
  let end: Date;
  if (ag.slotInicio) {
    start = new Date(ag.slotInicio);
    end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
  } else {
    const parsed = parseDataPreferida(ag.dataPreferida);
    start = parsed.start;
    end = parsed.end;
  }
  const payload = {
    subject: `Procon Jacareí - ${ag.nome}`,
    body: {
      contentType: 'text' as const,
      content: [
        `Motivo: ${ag.motivo}`,
        `Telefone: ${ag.telefone}`,
        `Data preferida informada: ${ag.dataPreferida}`,
        `ID agendamento: ${ag.id}`,
      ].join('\n'),
    },
    start: {
      dateTime: toGraphDateTime(start),
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: toGraphDateTime(end),
      timeZone: TIMEZONE,
    },
    location: {
      displayName: 'Procon Jacareí',
    },
  };

  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/calendar/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[Outlook] Erro ao criar evento:', res.status, text);
      return;
    }
    console.log('[Outlook] Evento criado no calendário para agendamento', ag.id);
  } catch (e) {
    console.error('[Outlook] Erro ao criar evento:', e);
  }
}
