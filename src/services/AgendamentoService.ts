import type { Agendamento, EstadoFluxoAgendamento } from '../types/agendamento';
import { AgendamentoStore } from './AgendamentoStore';

const store = new AgendamentoStore();

/** Estado do fluxo por telefone (em memória). */
const fluxoPorTelefone = new Map<string, EstadoFluxoAgendamento>();

function normalizarTelefone(t: string): string {
  return t.replace(/\D/g, '');
}

/** Horários de atendimento: manhã 9h–12h e tarde 14h–17h, slots de 30 min. */
const SLOTS_HORARIOS: { h: number; m: number }[] = [
  { h: 9, m: 0 }, { h: 9, m: 30 }, { h: 10, m: 0 }, { h: 10, m: 30 }, { h: 11, m: 0 }, { h: 11, m: 30 },
  { h: 14, m: 0 }, { h: 14, m: 30 }, { h: 15, m: 0 }, { h: 15, m: 30 }, { h: 16, m: 0 }, { h: 16, m: 30 },
];
const MAX_DIAS_BUSCA = 15;
const MAX_SLOTS_LISTADOS = 12;
/** Máximo de dias úteis mostrados na etapa "escolha o dia" (semana). */
const MAX_DIAS_LISTADOS = 7;

export class AgendamentoService {
  private agendamentoStore = store;

  getTextoInicio(): string {
    return `*Agendamento – Procon Jacareí*

Você pode solicitar um agendamento para atendimento presencial ou tirar dúvidas.

_Digite *cancelar* a qualquer momento para voltar ao menu._`;
  }

  /** Texto de consentimento para coleta de dados (LGPD). Exibido antes de pedir qualquer dado. */
  getTextoConsentimento(): string {
    return `*Consentimento para coleta de dados (LGPD)*

Para agendar, precisamos dos seguintes dados:
• Nome completo
• Número deste WhatsApp (já identificado)
• Motivo ou dúvida
• Data/horário preferido

*Finalidade:* agendamento e atendimento pelo Procon Jacareí.
*Base legal:* seu consentimento (Lei Geral de Proteção de Dados – LGPD).
Você pode solicitar exclusão ou correção dos dados entrando em contato com o Procon.

*Concorda em fornecer esses dados?*

*1* - Sim
*2* - Não

Digite *1* ou *2*:`;
  }

  getTextoConsentimentoRecusado(): string {
    return `Entendido. Não coletaremos seus dados. Digite *menu* para outras opções.`;
  }

  getPerguntaNome(): string {
    return `Por favor, digite seu *nome completo*:`;
  }

  getPerguntaMotivo(): string {
    return `Qual o *motivo* do atendimento ou sua *dúvida*? (Descreva em poucas palavras)`;
  }

  /** Não usado: fluxo vai direto para horários livres (opção de escolher data foi removida). */
  getPerguntaData(): string {
    return `*Horários disponíveis:*\n\nDigite *1* para ver os horários livres.`;
  }

  /** Retorna dias úteis (da semana) que têm pelo menos um horário livre. */
  getProximosDiasComSlots(): { label: string; dataKey: string }[] {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const resultado: { label: string; dataKey: string }[] = [];
    for (let d = 0; d < MAX_DIAS_BUSCA && resultado.length < MAX_DIAS_LISTADOS; d++) {
      const dia = new Date(from);
      dia.setDate(dia.getDate() + d);
      const dow = dia.getDay();
      if (dow === 0 || dow === 6) continue;
      const dataKey = dia.getFullYear() + '-' + String(dia.getMonth() + 1).padStart(2, '0') + '-' + String(dia.getDate()).padStart(2, '0');
      const slotsDia = this.getSlotsLivresParaDia(dataKey);
      if (slotsDia.length > 0) {
        const label = dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long' });
        resultado.push({ label, dataKey });
      }
    }
    return resultado;
  }

  /** Slots livres em um único dia (apenas horários). */
  getSlotsLivresParaDia(dataKey: string): { label: string; dataHora: string }[] {
    const [y, m, d] = dataKey.split('-').map(Number);
    const dia = new Date(y, m - 1, d, 0, 0, 0);
    const now = new Date();
    const ocupadosSet = new Set(
      this.agendamentoStore.getSlotsOcupados(dia, new Date(dia.getTime() + 24 * 60 * 60 * 1000))
    );
    const resultado: { label: string; dataHora: string }[] = [];
    const hoje = dataKey === now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    for (const { h, m } of SLOTS_HORARIOS) {
      const slotStart = new Date(dia);
      slotStart.setHours(h, m, 0, 0);
      if (hoje && slotStart <= now) continue;
      const iso = slotStart.toISOString();
      if (ocupadosSet.has(iso)) continue;
      resultado.push({
        label: slotStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        dataHora: iso,
      });
    }
    return resultado;
  }

  /** Gera lista de slots livres (não ocupados) nos próximos dias úteis. */
  getProximosSlotsLivres(): { label: string; dataHora: string }[] {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + MAX_DIAS_BUSCA);
    const ocupadosSet = new Set(
      this.agendamentoStore.getSlotsOcupados(from, to)
    );
    const resultado: { label: string; dataHora: string }[] = [];

    for (let d = 0; d < MAX_DIAS_BUSCA && resultado.length < MAX_SLOTS_LISTADOS; d++) {
      const dia = new Date(from);
      dia.setDate(dia.getDate() + d);
      const dow = dia.getDay();
      if (dow === 0 || dow === 6) continue; // fim de semana
      const hoje = d === 0;
      for (const { h, m } of SLOTS_HORARIOS) {
        const slotStart = new Date(dia);
        slotStart.setHours(h, m, 0, 0);
        if (hoje && slotStart <= now) continue;
        const iso = slotStart.toISOString();
        if (ocupadosSet.has(iso)) continue;
        const label = slotStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' às ' + slotStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        resultado.push({ label, dataHora: iso });
        if (resultado.length >= MAX_SLOTS_LISTADOS) break;
      }
    }
    return resultado;
  }

  formataListaDias(dias: { label: string; dataKey: string }[]): string {
    if (dias.length === 0) {
      return `Não há dias com horários livres na semana. Digite *1* para tentar novamente ou *cancelar* para voltar ao menu.`;
    }
    let msg = `*📅 Escolha o dia (datas da semana):*\n\n`;
    dias.forEach((d, i) => {
      msg += `${i + 1}. ${d.label}\n`;
    });
    msg += `\nDigite o *número* do dia desejado (ex: 1, 2, 3):`;
    return msg;
  }

  formataListaHoras(slots: { label: string; dataHora: string }[], diaLabel?: string): string {
    if (slots.length === 0) {
      return `Não há horários livres neste dia. Digite *cancelar* para voltar ao menu.`;
    }
    let msg = `*🕐 Escolha o horário:*\n\n`;
    if (diaLabel) msg += `_${diaLabel}_\n\n`;
    slots.forEach((s, i) => {
      msg += `${i + 1}. ${s.label}\n`;
    });
    msg += `\nDigite o *número* do horário desejado (ex: 1, 2, 3):`;
    return msg;
  }

  formataListaSlotsLivres(slots: { label: string; dataHora: string }[]): string {
    if (slots.length === 0) {
      return `Não há horários livres nos próximos dias. Digite *1* para tentar novamente ou *cancelar* para voltar ao menu.`;
    }
    let msg = `*Horários livres (Procon):*\n\n`;
    slots.forEach((s, i) => {
      msg += `${i + 1}. ${s.label}\n`;
    });
    msg += `\nDigite o *número* do horário desejado (ex: 3):`;
    return msg;
  }

  getConfirmacao(estado: EstadoFluxoAgendamento): string {
    return `*Confirme seus dados*

👤 Nome: ${estado.nome || '-'}
📋 Motivo: ${estado.motivo || '-'}
📅 Data preferida: ${estado.dataPreferida || '-'}

*1* - Enviar
*2* - Desistir

Digite *1* ou *2*:`;
  }

  getSucesso(protocolo?: string, dataHoraEscolhida?: string, enderecoProcon?: string): string {
    let msg = `✅ *Seu agendamento foi confirmado!*`;
    if (dataHoraEscolhida) {
      msg += `

📅 *Data e horário:* ${dataHoraEscolhida}`;
    }
    if (enderecoProcon) {
      msg += `

${enderecoProcon}`;
    }
    if (protocolo) {
      msg += `

📋 *Protocolo:* ${protocolo}`;
    }
    msg += `

📄 *Documentos para levar:* documento pessoal (RG/CPF), comprovantes do problema e CNPJ da matriz do fornecedor (quando aplicável). Outros documentos podem ser solicitados conforme o caso.`;
    msg += `

Digite *menu* para outras opções.`;
    return msg;
  }

  /** Inicia o fluxo para o telefone (primeiro passo: consentimento). */
  iniciarFluxo(telefone: string): void {
    fluxoPorTelefone.set(normalizarTelefone(telefone), { step: 'consentimento' });
  }

  /** Registra consentimento e avança para nome; ou cancela o fluxo. Retorna true se aceitou. */
  setConsentimento(telefone: string, aceito: boolean): boolean {
    const key = normalizarTelefone(telefone);
    if (!aceito) {
      fluxoPorTelefone.delete(key);
      return false;
    }
    const e = fluxoPorTelefone.get(key);
    if (!e || e.step !== 'consentimento') return false;
    e.step = 'nome';
    fluxoPorTelefone.set(key, e);
    return true;
  }

  /** Retorna o estado atual ou undefined se não está no fluxo. */
  getEstado(telefone: string): EstadoFluxoAgendamento | undefined {
    return fluxoPorTelefone.get(normalizarTelefone(telefone));
  }

  isInFluxo(telefone: string): boolean {
    return fluxoPorTelefone.has(normalizarTelefone(telefone));
  }

  setNome(telefone: string, nome: string): void {
    const key = normalizarTelefone(telefone);
    const e = fluxoPorTelefone.get(key) ?? { step: 'nome' };
    e.nome = nome.trim();
    e.step = 'motivo';
    fluxoPorTelefone.set(key, e);
  }

  setMotivo(telefone: string, motivo: string): void {
    const key = normalizarTelefone(telefone);
    const e = fluxoPorTelefone.get(key)!;
    e.motivo = motivo.trim();
    e.step = 'data';
    fluxoPorTelefone.set(key, e);
  }

  setData(telefone: string, data: string): void {
    const key = normalizarTelefone(telefone);
    const e = fluxoPorTelefone.get(key)!;
    e.dataPreferida = data.trim();
    e.step = 'confirmar';
    fluxoPorTelefone.set(key, e);
  }

  /** Mostra dias da semana com horários livres. Se não houver dias, mantém step em 'data'. */
  setDiasDisponiveis(telefone: string): { label: string; dataKey: string }[] {
    const key = normalizarTelefone(telefone);
    const e = fluxoPorTelefone.get(key)!;
    const dias = this.getProximosDiasComSlots();
    e.diasDisponiveis = dias;
    e.step = dias.length > 0 ? 'escolher_dia' : 'data';
    fluxoPorTelefone.set(key, e);
    return dias;
  }

  /** Usuário escolheu o dia (1-based). Retorna slots do dia e label do dia para exibir. */
  setDiaEscolhido(telefone: string, numero: number): { slots: { label: string; dataHora: string }[]; diaLabel: string } | null {
    const key = normalizarTelefone(telefone);
    const e = fluxoPorTelefone.get(key);
    if (!e || e.step !== 'escolher_dia' || !e.diasDisponiveis?.length) return null;
    const idx = numero - 1;
    if (idx < 0 || idx >= e.diasDisponiveis.length) return null;
    const dia = e.diasDisponiveis[idx];
    e.diaEscolhido = dia.dataKey;
    e.diasDisponiveis = undefined;
    const slots = this.getSlotsLivresParaDia(dia.dataKey);
    e.slotsDisponiveis = slots;
    e.step = 'escolher_slot';
    fluxoPorTelefone.set(key, e);
    return { slots, diaLabel: dia.label };
  }

  /** Mostra horários livres e passa para o passo de escolher por número. Se não houver slots, mantém step em 'data'. (Usado quando não há dias no fluxo dia→hora.) */
  setSlotsDisponiveis(telefone: string): { label: string; dataHora: string }[] {
    const key = normalizarTelefone(telefone);
    const e = fluxoPorTelefone.get(key)!;
    const slots = this.getProximosSlotsLivres();
    e.slotsDisponiveis = slots;
    if (slots.length > 0) {
      e.step = 'escolher_slot';
    }
    fluxoPorTelefone.set(key, e);
    return slots;
  }

  /** Escolha do horário por número (1-based). Retorna true se válido. */
  setSlotEscolhido(telefone: string, numero: number): boolean {
    const key = normalizarTelefone(telefone);
    const e = fluxoPorTelefone.get(key);
    if (!e || e.step !== 'escolher_slot' || !e.slotsDisponiveis?.length) return false;
    const idx = numero - 1;
    if (idx < 0 || idx >= e.slotsDisponiveis.length) return false;
    const slot = e.slotsDisponiveis[idx];
    e.slotInicio = slot.dataHora;
    if (e.diaEscolhido) {
      const [y, m, d] = e.diaEscolhido.split('-').map(Number);
      const dataStr = new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      e.dataPreferida = `${dataStr} às ${slot.label}`;
      e.diaEscolhido = undefined;
    } else {
      e.dataPreferida = slot.label;
    }
    e.slotsDisponiveis = undefined;
    e.step = 'confirmar';
    fluxoPorTelefone.set(key, e);
    return true;
  }

  cancelarFluxo(telefone: string): void {
    fluxoPorTelefone.delete(normalizarTelefone(telefone));
  }

  /** Confirma e persiste o agendamento. Retorna o agendamento criado. */
  confirmarESalvar(telefone: string): { ok: true; ag: Agendamento } | { ok: false; msg: string } {
    const key = normalizarTelefone(telefone);
    const e = fluxoPorTelefone.get(key);
    if (!e || e.step !== 'confirmar' || !e.nome || !e.motivo) {
      return { ok: false, msg: 'Dados incompletos. Digite *menu* e escolha *4* para recomeçar.' };
    }
    const ag = this.agendamentoStore.add({
      telefone,
      nome: e.nome,
      motivo: e.motivo,
      dataPreferida: e.dataPreferida || 'Não informada',
      slotInicio: e.slotInicio,
      status: 'solicitado',
    });
    fluxoPorTelefone.delete(key);
    return { ok: true, ag };
  }

  getStore(): AgendamentoStore {
    return this.agendamentoStore;
  }
}
