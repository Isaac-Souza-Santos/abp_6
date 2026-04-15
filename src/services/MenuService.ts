/**
 * Textos e menus do atendimento Procon Jacareí/SP
 */
export class MenuService {
  private getBlocoOpcoesMenu(): string {
    return `*1* - Orientações e direitos do consumidor
*2* - Quais documentos levar para comparecer ao Procon
*3* - Contato, endereço e horário
*4* - Agendamento (solicitar ou tirar dúvidas)`;
  }

  /** Saudações (oi, bom dia...): boas-vindas, menu resumido e convite à dúvida. */
  getQualSuaDuvida(): string {
    return `*Seja bem-vindo(a) ao chatbot do Procon Jacareí/SP*

Sou o assistente virtual deste atendimento. Veja as opções abaixo: você pode enviar o *número* da opção ou escrever sua dúvida em texto livre.

${this.getBlocoOpcoesMenu()}

*Qual opção você prefere ou qual é a sua dúvida?*

_Digite *menu* quando quiser ver este resumo de novo._`;
  }

  getWelcome(): string {
    return `*Procon Jacareí - Atendimento WhatsApp*

Seja bem-vindo(a) ao *chatbot do Procon Jacareí/SP*. Sou o assistente virtual deste canal.

Escolha uma opção digitando o *número*:

${this.getBlocoOpcoesMenu()}

Digite *menu* a qualquer momento para ver as opções.`;
  }

  /** Mensagem quando a pessoa cancela ou desiste do agendamento, com opções abaixo. */
  getMensagemDesistenciaAgendamento(): string {
    return `Agendamento cancelado. Sem problemas!

_Qualquer dúvida, digite *menu* ou faça agendamento (*4*)._`;
  }

  /** Opção 1: orientações + direitos (unificado). */
  getOrientacoesEDireitos(): string {
    return `*Orientações e direitos do consumidor*

*Orientações:*
• Antes de comprar: pesquise preços, leia o contrato e exija nota fiscal.
• Produto com defeito: você pode exigir troca ou devolução em até 7 dias (produtos não perecíveis).
• Serviço não prestado: exija reembolso ou a execução do serviço.
• Cobrança indevida: proteste por escrito e guarde comprovantes.

*Direitos básicos (CDC - Lei 8.078/90):*
1. Proteção da vida e saúde
2. Educação e divulgação para o consumo
3. Informação adequada sobre produtos e serviços
4. Proteção contra publicidade enganosa
5. Proteção contra práticas abusivas
6. Indenização por danos
7. Acesso à Justiça e facilitação da defesa
8. Qualidade dos serviços públicos

O Procon orienta e atua na mediação entre consumidor e fornecedor.

_Agendamento: *4*. Menu: *menu*._`;
  }

  /** Opção 2: quais documentos levar para comparecer ao Procon. */
  getReclamacao(): string {
    return `*Quais documentos levar para comparecer ao Procon*

Para registrar uma reclamação é necessário *comparecer presencialmente* ao Procon Jacareí. Documentos que costumam ser necessários:

• *Documento pessoal* (RG e CPF)
• *Comprovantes do problema* (nota fiscal, contrato, faturas, prints de conversas)
• *CNPJ da matriz do fornecedor* (quando aplicável)

Cada caso pode exigir outros documentos. Por isso, o comparecimento à sede do Procon permite uma análise detalhada.

1. Reúna os documentos acima.
2. Agende sua visita: digite *4* para agendamento.
3. Compareça no dia e horário com os documentos.

_Contato e endereço: opção *3* no menu._

_Agendamento: *4*. Menu: *menu*._`;
  }

  /** Opção 3: contato + horário (unificado). */
  getContatoEHorario(): string {
    return `*Procon Jacareí - Contato, endereço e horário*

${this.getEnderecoProcon()}

💬 *WhatsApp:* (12) 3955-9130
✉️ *E-mail:* procon@jacarei.sp.gov.br

🌐 *Site:* Prefeitura de Jacareí - Secretaria/Procon

*Horário de atendimento:* de segunda a sexta-feira, das 08h às 16h.
_Distribuição de senhas até às 15h15._

_As informações podem ser confirmadas no portal oficial da Prefeitura._

_Agendamento: *4*. Menu: *menu*._`;
  }

  /** Retorna apenas o endereço do Procon (para uso na mensagem de agendamento confirmado). */
  getEnderecoProcon(): string {
    return `📍 *Endereço:* Avenida Capitão Joaquim Pinheiro do Prado, 222 - Centro, Jacareí/SP
📮 *CEP:* 12.327-160`;
  }

  getContato(): string {
    return `*Procon Jacareí - Contato*

${this.getEnderecoProcon()}

💬 *WhatsApp:* (12) 3955-9130
✉️ *E-mail:* procon@jacarei.sp.gov.br

🌐 *Site:* Prefeitura de Jacareí - Secretaria/Procon

_As informações de endereço podem ser confirmadas no portal oficial da Prefeitura._

_Agendamento: *4*. Menu: *menu*._`;
  }

  getHorario(): string {
    return `*Horário de atendimento*

De segunda a sexta-feira, das 08h às 16h.
Distribuição de senhas até às 15h15.

_Agendamento: *4*. Menu: *menu*._`;
  }

  getDireitos(): string {
    return `*Direitos básicos do consumidor (CDC - Lei 8.078/90)*

1. *Proteção da vida e saúde*
2. *Educação e divulgação* para o consumo
3. *Informação* adequada sobre produtos e serviços
4. *Proteção contra publicidade enganosa*
5. *Proteção contra práticas abusivas*
6. *Indenização* por danos
7. *Acesso à Justiça* e facilitação da defesa
8. *Qualidade dos serviços* públicos

O Procon orienta e atua na mediação entre consumidor e fornecedor.

_Agendamento: *4*. Menu: *menu*._`;
  }

  getAgendamento(): string {
    return `Para solicitar *agendamento* ou tirar dúvidas sobre atendimento, escolha a opção *4* no menu.`;
  }

  getDefaultReply(): string {
    return `Não entendi. Digite *menu* para ver as opções disponíveis ou escolha um número de *1* a *4*.`;
  }
}
