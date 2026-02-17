/**
 * Textos e menus do atendimento Procon Jacareí/SP
 */
export class MenuService {
  getWelcome(): string {
    return `*Procon Jacareí - Atendimento WhatsApp*

Olá! Sou o assistente virtual do *Procon de Jacareí/SP*.

Escolha uma opção digitando o *número*:

*1* - Orientações ao consumidor
*2* - Como registrar reclamação
*3* - Contato e endereço
*4* - Horário de atendimento
*5* - Seus direitos básicos
*6* - Agendamento (solicitar ou tirar dúvidas)

Digite *menu* a qualquer momento para ver as opções.`;
  }

  getOrientacoes(): string {
    return `*Orientações ao consumidor*

• Antes de comprar: pesquise preços, leia o contrato e exija nota fiscal.
• Produto com defeito: você pode exigir troca ou devolução em até 7 dias (produtos não perecíveis).
• Serviço não prestado: exija reembolso ou a execução do serviço.
• Cobrança indevida: proteste por escrito e guarde comprovantes.

Para *registrar uma reclamação*, volte ao menu e escolha a opção *2*.`;
  }

  getReclamacao(): string {
    return `*Como registrar uma reclamação*

1. Reúna documentos: nota fiscal, contrato, prints de conversas (se aplicável).
2. Compareça ao Procon Jacareí ou acesse o site oficial para registro online (quando disponível).
3. Descreva o problema de forma clara e objetiva.
4. Guarde o protocolo de atendimento.

*Contato* para agendamento e dúvidas: opção *3* no menu.`;
  }

  /** Retorna apenas o endereço do Procon (para uso na mensagem de agendamento confirmado). */
  getEnderecoProcon(): string {
    return `📍 *Endereço:* Consulte o site oficial da Prefeitura de Jacareí - Procon`;
  }

  getContato(): string {
    return `*Procon Jacareí - Contato*

${this.getEnderecoProcon()}

📞 *Telefone/WhatsApp:* (12) 99207-4513

🌐 *Site:* Prefeitura de Jacareí - Secretaria/Procon

_As informações de endereço podem ser confirmadas no portal oficial da Prefeitura._`;
  }

  getHorario(): string {
    return `*Horário de atendimento*

Os horários do Procon Jacareí podem ser consultados no site oficial da Prefeitura de Jacareí.

Geralmente o atendimento presencial segue o horário de funcionamento da Prefeitura. Consulte sempre o canal oficial para confirmar.`;
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

O Procon orienta e atua na mediação entre consumidor e fornecedor.`;
  }

  getAgendamento(): string {
    return `Para solicitar *agendamento* ou tirar dúvidas sobre atendimento, escolha a opção *6* no menu.`;
  }

  getDefaultReply(): string {
    return `Não entendi. Digite *menu* para ver as opções disponíveis ou escolha um número de *1* a *6*.`;
  }
}
