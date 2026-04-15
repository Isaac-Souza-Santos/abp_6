import type { Client, Message } from 'whatsapp-web.js';
import { MenuService } from '../services/MenuService';
import { AgendamentoService } from '../services/AgendamentoService';
import { criarEventoOutlook } from '../services/OutlookCalendarService';
import { GroqService } from '../services/GroqService';
import { GroqMetricasStore } from '../services/GroqMetricasStore';

const ADMIN_NUMBER = (process.env.ADMIN_NUMBER || '').replace(/\D/g, '');

function isAtendente(from: string): boolean {
  if (!ADMIN_NUMBER) return false;
  const num = from.replace(/\D/g, '').replace('@c.us', '');
  return num === ADMIN_NUMBER || num.endsWith(ADMIN_NUMBER);
}

function normalizaTextoParaComparacao(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSaudacao(texto: string): boolean {
  const normalizado = normalizaTextoParaComparacao(texto);
  if (!normalizado) return false;

  // Aceita variações comuns de saudação na primeira mensagem:
  // "oi", "oi!", "oiii", "olá", "olaaa", "bom dia", "oi tudo bem", etc.
  return /^(oi+|ola+|bom dia|boa tarde|boa noite|e ai|eae|fala|salve|hey|hi|hello)\b/.test(normalizado);
}

export class MessageHandler {
  private menuService: MenuService;
  private agendamentoService: AgendamentoService;
  private groqService: GroqService;
  private groqMetricasStore: GroqMetricasStore;
  /** Usuários aguardando resposta sim/não após resposta da Groq */
  private aguardandoAvaliacaoGroq = new Map<string, boolean>();

  constructor() {
    this.menuService = new MenuService();
    this.agendamentoService = new AgendamentoService();
    this.groqService = new GroqService();
    this.groqMetricasStore = new GroqMetricasStore();
  }

  async handle(client: Client, message: Message): Promise<void> {
    const from = message.from;
    const body = (message.body || '').trim().replace(/\s+/g, ' ');
    const bodyLower = body.toLowerCase();
    const isGroup = (await message.getChat()).isGroup;

    if (isGroup) return;

    try {
      // Avaliação pós-resposta Groq: "Isso ajudou? sim/não"
      if (this.aguardandoAvaliacaoGroq.has(from)) {
        const sim = bodyLower === 'sim' || bodyLower === 's' || body === '1';
        const nao = bodyLower === 'não' || bodyLower === 'nao' || bodyLower === 'n' || body === '2';
        if (sim) {
          this.groqMetricasStore.incrementSatisfatoria();
          this.aguardandoAvaliacaoGroq.delete(from);
          await message.reply(
            '✅ Obrigado! Resposta registrada como *satisfatória*. Protocolo finalizado.\n\n_Digite *menu* para mais opções._'
          );
          return;
        }
        if (nao) {
          this.groqMetricasStore.incrementNaoSatisfatoria();
          this.aguardandoAvaliacaoGroq.delete(from);
          await message.reply(
            'Sentimos por não ter ajudado. Digite *menu* para outras opções ou *4* para agendamento.'
          );
          return;
        }
        this.aguardandoAvaliacaoGroq.delete(from);
      }

      // Comando atendente: histórico + métricas (apenas número configurado em ADMIN_NUMBER)
      if (isAtendente(from) && (bodyLower === 'atendente' || bodyLower === 'historico' || bodyLower === 'metricas')) {
        await message.reply(this.getRespostaAtendente());
        return;
      }

      // Atendente: marcar protocolo "virou processo" ou "gestão pública" (ex.: processo ag-123 ou gestao ag-123)
      if (isAtendente(from)) {
        const processoMatch = body.match(/^processo\s+(\S+)$/i);
        const gestaoMatch = body.match(/^gest[aã]o\s+(\S+)$/i);
        const store = this.agendamentoService.getStore();
        if (processoMatch) {
          const ok = store.update(processoMatch[1].trim(), { virouProcesso: true });
          await message.reply(ok ? `✅ Protocolo ${processoMatch[1].trim()} marcado como *virou processo*.` : `❌ Protocolo não encontrado. Use o ID ex: ag-1234567890-abc123`);
          return;
        }
        if (gestaoMatch) {
          const ok = store.update(gestaoMatch[1].trim(), { gestaoPublica: true });
          await message.reply(ok ? `✅ Protocolo ${gestaoMatch[1].trim()} marcado como *gestão pública*.` : `❌ Protocolo não encontrado. Use o ID ex: ag-1234567890-abc123`);
          return;
        }
      }

      // Cancelar fluxo de agendamento
      if (this.agendamentoService.isInFluxo(from) && bodyLower === 'cancelar') {
        this.agendamentoService.cancelarFluxo(from);
        await message.reply(this.menuService.getMensagemDesistenciaAgendamento());
        return;
      }

      // Fluxo de agendamento (já dentro)
      if (this.agendamentoService.isInFluxo(from)) {
        await this.handleFluxoAgendamento(message, from, body);
        return;
      }

      // Menu / início: mostra opções 1 a 6 (inclui typo "memu")
      if (bodyLower === 'menu' || bodyLower === 'memu' || bodyLower === 'inicio' || bodyLower === 'início') {
        await message.reply(this.menuService.getWelcome());
        return;
      }

      // Saudações (oi, boa tarde...): pergunta qual a dúvida
      const ehSaudacao = isSaudacao(body);
      if (ehSaudacao) {
        await message.reply(this.menuService.getQualSuaDuvida());
        return;
      }

      if (body === '1') {
        await message.reply(this.menuService.getOrientacoesEDireitos());
        return;
      }

      if (body === '2') {
        await message.reply(this.menuService.getReclamacao());
        return;
      }

      if (body === '3') {
        await message.reply(this.menuService.getContatoEHorario());
        return;
      }

      if (body === '4') {
        this.agendamentoService.iniciarFluxo(from);
        await message.reply(
          this.agendamentoService.getTextoInicio() + '\n\n' + this.agendamentoService.getTextoConsentimento()
        );
        return;
      }

      // Dúvida em texto livre: tentar Groq (contexto Procon/CDC) se configurado
      if (this.groqService.estaDisponivel() && body.length >= 3) {
        const respostaGroq = await this.groqService.perguntar(body);
        if (respostaGroq) {
          const texto = respostaGroq.length > 3500 ? respostaGroq.slice(0, 3500) + '…' : respostaGroq;
          this.aguardandoAvaliacaoGroq.set(from, true);
          await message.reply(
            texto +
              '\n\n_Isso ajudou? Responda *1* para sim ou *2* para não._' +
              '\n\n_Agendamento: *4*. Menu: *menu*._'
          );
          return;
        }
      }

      await message.reply(this.menuService.getDefaultReply());
    } catch (err) {
      console.error('Erro ao processar mensagem:', err);
      await message.reply(
        'Desculpe, ocorreu um erro. Por favor, tente novamente ou digite *menu* para ver as opções.'
      );
    }
  }

  private async handleFluxoAgendamento(message: Message, from: string, body: string): Promise<void> {
    const estado = this.agendamentoService.getEstado(from)!;
    const bodyLower = body.toLowerCase().trim();

    switch (estado.step) {
      case 'consentimento': {
        const aceito = bodyLower === 'sim' || bodyLower === 's' || bodyLower === '1' || bodyLower === 'concordo';
        const recusou = bodyLower === 'não' || bodyLower === 'nao' || bodyLower === 'n' || bodyLower === '2';
        if (aceito && this.agendamentoService.setConsentimento(from, true)) {
          await message.reply(this.agendamentoService.getPerguntaNome());
        } else if (recusou) {
          this.agendamentoService.setConsentimento(from, false);
          await message.reply(this.agendamentoService.getTextoConsentimentoRecusado());
        } else {
          await message.reply(
            'Digite *1* para SIM ou *2* para NÃO.'
          );
        }
        break;
      }
      case 'nome':
        this.agendamentoService.setNome(from, body);
        await message.reply(this.agendamentoService.getPerguntaMotivo());
        break;
      case 'motivo': {
        this.agendamentoService.setMotivo(from, body);
        const dias = this.agendamentoService.setDiasDisponiveis(from);
        await message.reply(this.agendamentoService.formataListaDias(dias));
        break;
      }
      case 'data': {
        // Só chega aqui quando não há dias com horários
        if (body === '1') {
          const dias = this.agendamentoService.setDiasDisponiveis(from);
          await message.reply(this.agendamentoService.formataListaDias(dias));
        } else {
          await message.reply(
            'Digite *1* para tentar ver os dias novamente ou *cancelar* para voltar ao menu.'
          );
        }
        break;
      }
      case 'escolher_dia': {
        const numDia = parseInt(body, 10);
        if (Number.isNaN(numDia) || numDia < 1) {
          await message.reply('Digite o *número* do dia desejado (ex: 1, 2, 3):');
          break;
        }
        const result = this.agendamentoService.setDiaEscolhido(from, numDia);
        if (result) {
          await message.reply(this.agendamentoService.formataListaHoras(result.slots, result.diaLabel));
        } else {
          await message.reply('Número inválido. Digite o número do dia da lista (ex: 1):');
        }
        break;
      }
      case 'escolher_slot': {
        const num = parseInt(body, 10);
        if (Number.isNaN(num) || num < 1) {
          await message.reply('Digite o *número* do horário desejado (ex: 1, 2, 3...):');
          break;
        }
        if (this.agendamentoService.setSlotEscolhido(from, num)) {
          const novoEstado = this.agendamentoService.getEstado(from)!;
          await message.reply(this.agendamentoService.getConfirmacao(novoEstado));
        } else {
          await message.reply('Número inválido. Digite o número do horário da lista (ex: 1):');
        }
        break;
      }
      case 'confirmar': {
        const enviar = body === '1' || body.toLowerCase() === 'confirmar';
        const desistir = body === '2' || bodyLower === 'cancelar';
        if (enviar) {
          const result = this.agendamentoService.confirmarESalvar(from);
          if (result.ok) {
            await message.reply(this.agendamentoService.getSucesso(result.ag.id, result.ag.dataPreferida, this.menuService.getEnderecoProcon()));
            criarEventoOutlook(result.ag).catch(() => {});
          } else {
            await message.reply(result.msg);
          }
        } else if (desistir) {
          this.agendamentoService.cancelarFluxo(from);
          await message.reply(this.menuService.getMensagemDesistenciaAgendamento());
        } else {
          await message.reply(
            'Digite *1* para enviar ou *2* para desistir.\n\n' +
              this.agendamentoService.getConfirmacao(estado)
          );
        }
        break;
      }
    }
  }

  private getRespostaAtendente(): string {
    const store = this.agendamentoService.getStore();
    const metricas = store.getMetricas();
    const lista = store.listarTodos().slice(0, 20);

    let msg = `*📋 Painel Atendente – Histórico e Métricas*\n\n`;
    msg += `*Ciclo do protocolo:*\n`;
    msg += `✅ Vira dado: ${metricas.viraDado}\n`;
    msg += `✅ Vira processo: ${metricas.viraProcesso}\n`;
    msg += `✅ Gestão pública: ${metricas.gestaoPublica}\n\n`;
    msg += `*Métricas:*\n`;
    msg += `• Total: ${metricas.total} | Hoje: ${metricas.hoje} | Últimos 7 dias: ${metricas.ultimos7Dias}\n`;
    msg += `• Por status: solicitado ${metricas.porStatus.solicitado}, confirmado ${metricas.porStatus.confirmado}, atendido ${metricas.porStatus.atendido}, cancelado ${metricas.porStatus.cancelado}\n`;
    const groqM = this.groqMetricasStore.getMetricas();
    msg += `• Resposta Groq: satisfatória ${groqM.satisfatoria} | não satisfatória ${groqM.naoSatisfatoria}\n\n`;
    msg += `*Marcar protocolo:*\n`;
    msg += `• _processo [ID]_ → virou processo\n`;
    msg += `• _gestao [ID]_ → gestão pública\n\n`;
    msg += `*Últimos agendamentos (histórico):*\n`;

    if (lista.length === 0) {
      msg += `_Nenhum agendamento registrado._`;
    } else {
      for (const a of lista) {
        const data = new Date(a.criadoEm).toLocaleString('pt-BR');
        const flags = [a.virouProcesso && 'processo', a.gestaoPublica && 'gestão'].filter(Boolean).join(', ') || '-';
        msg += `\n📌 ${a.nome} | ${a.telefone}\n`;
        msg += `   ID: ${a.id} | ${a.dataPreferida} | ${a.status}\n`;
        msg += `   Motivo: ${a.motivo}\n`;
        msg += `   Processo/Gestão: ${flags} | _${data}_\n`;
      }
    }

    return msg;
  }
}
