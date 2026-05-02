/** Monta texto final enviado no WhatsApp após resposta sanitizada da Groq. */
export function montarRespostaGroqWhatsApp(corpoOrientacaoLimpo: string, maxChars = 3500): string {
  let texto =
    corpoOrientacaoLimpo.trim().length > maxChars
      ? corpoOrientacaoLimpo.slice(0, maxChars).trimEnd() + '…'
      : corpoOrientacaoLimpo.trim();
  texto +=
    '\n\n_' +
    'Esta mensagem é só uma orientação automática (_não_ abre ou confirma protocolo aqui).' +
    ' Ajudou? Responda *1* para sim ou *2* para não._' +
    '\n\n_Agendamento: *4*. Menu: *menu*._';
  return texto;
}
