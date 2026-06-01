import type {
  AgendaAtendentesConfig,
  AgendaLembreteConfirmacaoConfig,
  Agendamento,
  ApiResponse,
} from "../types/painel";

const now = new Date();
const isoDaysAgo = (days: number, hour = 10, minute = 0): string => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const isoFuture = (days: number, hour = 14, minute = 30): string => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const mockAgendamentos: Agendamento[] = [
  {
    id: "PROT-2026-0042",
    telefone: "5512999887766",
    nome: "Maria Silva Santos",
    motivo: "Cobrança indevida no cartão de crédito após cancelamento do serviço.",
    dataPreferida: "2026-06-05",
    slotInicio: isoFuture(3, 9, 0),
    atendenteId: "ana-paula-1",
    atendenteNome: "Ana Paula",
    status: "confirmado",
    criadoEm: isoDaysAgo(5, 11, 20),
    atualizadoEm: isoDaysAgo(1, 9, 15),
    participantes: [{ nome: "João Silva", telefone: "5512999001122" }],
    observacaoAtendente: "Cliente trouxe extrato bancário.",
  },
  {
    id: "PROT-2026-0041",
    telefone: "5512988776655",
    nome: "Carlos Eduardo Lima",
    motivo: "Produto com defeito — geladeira não liga após 15 dias de uso.",
    dataPreferida: "2026-06-03",
    slotInicio: isoFuture(1, 14, 0),
    atendenteId: "ricardo-2",
    atendenteNome: "Ricardo Mendes",
    status: "solicitado",
    criadoEm: isoDaysAgo(2, 16, 45),
    atualizadoEm: isoDaysAgo(2, 16, 45),
  },
  {
    id: "PROT-2026-0038",
    telefone: "5512977665544",
    nome: "Fernanda Oliveira",
    motivo: "Empréstimo consignado não autorizado descontado no benefício.",
    dataPreferida: "2026-05-28",
    slotInicio: isoDaysAgo(0, 10, 30),
    atendenteNome: "Ana Paula",
    status: "atendido",
    criadoEm: isoDaysAgo(8, 8, 10),
    atualizadoEm: isoDaysAgo(0, 11, 5),
    atendidoPorNome: "Equipe Procon — Ana",
    atendidoPorEm: isoDaysAgo(0, 11, 5),
    virouProcesso: true,
    gestaoPublica: false,
    observacaoAtendente: "Orientada a registrar reclamação no Procon online.",
  },
  {
    id: "PROT-2026-0035",
    telefone: "5512966554433",
    nome: "Roberto Almeida",
    motivo: "Cancelamento de plano de telefonia com cobrança de multa.",
    dataPreferida: "2026-05-20",
    status: "cancelado",
    criadoEm: isoDaysAgo(12, 14, 0),
    atualizadoEm: isoDaysAgo(4, 10, 0),
    lembreteConfirmacaoEnviadoEm: isoDaysAgo(5, 9, 0),
  },
  {
    id: "PROT-2026-0030",
    telefone: "5512955443322",
    nome: "Juliana Costa Pereira",
    motivo: "Arrependimento de compra online — prazo de 7 dias.",
    dataPreferida: "2026-06-10",
    slotInicio: isoFuture(8, 11, 0),
    atendenteId: "ana-paula-1",
    atendenteNome: "Ana Paula",
    status: "confirmado",
    criadoEm: isoDaysAgo(1, 9, 30),
    atualizadoEm: isoDaysAgo(0, 15, 20),
    participantes: [
      { nome: "Pedro Costa", telefone: "5512955009988" },
      { nome: "Lucia Pereira" },
    ],
  },
  {
    id: "PROT-2026-0025",
    telefone: "5512944332211",
    nome: "Antônio Ferreira",
    motivo: "Divergência de preço na gôndola vs caixa do supermercado.",
    dataPreferida: "2026-06-02",
    status: "solicitado",
    criadoEm: isoDaysAgo(0, 17, 10),
    atualizadoEm: isoDaysAgo(0, 17, 10),
    gestaoPublica: true,
  },
];

export const mockApiResponse: ApiResponse = {
  total: mockAgendamentos.length,
  agendamentos: mockAgendamentos,
  metricas: {
    total: mockAgendamentos.length,
    hoje: 2,
    ultimos7Dias: 5,
    viraDado: 12,
    viraProcesso: 8,
    gestaoPublica: 3,
    porStatus: {
      solicitado: 2,
      confirmado: 2,
      cancelado: 1,
      atendido: 1,
    },
  },
  groqMetricas: {
    satisfatoria: 47,
    naoSatisfatoria: 11,
  },
};

export const mockLembreteConfirmacao: AgendaLembreteConfirmacaoConfig = {
  ativo: true,
  antecedenciaDias: 1,
  mensagemTemplate: `Olá, {nome}!

Lembramos o seu atendimento no Procon Jacareí em *{dataHora}*.
Motivo: {motivo}
Protocolo: {protocolo}
Local: {endereco} — {guiche}

Confirma o comparecimento?
Responda *1* para SIM ou *2* para NÃO.`,
};

export const mockAtendentesConfig: AgendaAtendentesConfig = {
  atendentes: [
    {
      id: "ana-paula-1",
      nome: "Ana Paula",
      intervaloMinutos: 30,
      blocos: [
        { inicioH: 9, inicioM: 0, fimH: 12, fimM: 0 },
        { inicioH: 14, inicioM: 0, fimH: 17, fimM: 0 },
      ],
      almoco: { inicioH: 12, inicioM: 0, fimH: 13, fimM: 0 },
    },
    {
      id: "ricardo-2",
      nome: "Ricardo Mendes",
      intervaloMinutos: 20,
      blocos: [
        { inicioH: 8, inicioM: 30, fimH: 12, fimM: 30 },
        { inicioH: 13, inicioM: 30, fimH: 17, fimM: 30 },
      ],
    },
  ],
};
