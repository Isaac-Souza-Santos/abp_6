/**
 * Normaliza respostas do assistente Groq antes do envio no WhatsApp:
 * remove fechos falsos (“protocolo confirmado”) e listas finais “1-/2-” que
 * conflitam com “1=satisfação / 2=não ajudou” do bot (tiers gratuitos Groq).
 */
export function sanitizarRespostaGroq(raw: string): string {
  const fraseConfirmacaoLinha =
    /^(?:(?:✓|✅|📌|⭐️)\s*)?(confirmado|confirmada|confirmamos|(?:seu\s+)?pedido\s+foi\s+confirmado|(?:foi\s+)?registrad[oa](?:\s+com\s+sucesso)?|(?:protocolo\s+)?(?:finalizado|encerrado|registrado)|solicita[çc][aã]o\s+conclu[ií]da)[\s!.…]*$/iu;

  function linhaEhOpcao12(linha: string): boolean {
    const t = linha.trim();
    if (t.length > 220) return false;
    /** Lista “1.” / “2.” em texto normativo não é menu do WhatsApp — não remover. */
    if (/^[12]\.\s+\S/.test(t)) return false;
    return (
      /^[*_]*\s*[12]\s*[*_]*\s*[)–—:-]\s+\S/.test(t) ||
      /^[12]\)\s+\S/.test(t) ||
      /^\*\s*[12]\s*\*\s*[:–-]/.test(t)
    );
  }

  function linhaEhConviteAlternativas(linha: string): boolean {
    const t = linha.trim();
    return (
      /^(quer|deseja|prefere|gostaria|opções|escolha|qual\s+opção|pode\s+escolher|enviar\s+mais|mais\s+detalhes)/i.test(
        t
      ) || (t.includes('?') && /(mais\s+detalhes|continuar|enviar|escolher)/i.test(t))
    );
  }

  let partes = raw.split(/\r?\n/);

  while (partes.length && !partes[partes.length - 1]?.trim()) {
    partes.pop();
  }

  while (partes.length) {
    const last = partes[partes.length - 1].trim();
    if (fraseConfirmacaoLinha.test(last)) {
      partes.pop();
      while (partes.length && !partes[partes.length - 1]?.trim()) partes.pop();
      continue;
    }
    break;
  }

  let i = partes.length - 1;
  let opcoesSeguidas = 0;
  let indicePrimeiraOpcao = -1;
  while (i >= 0) {
    const L = partes[i];
    if (!L.trim()) {
      i--;
      continue;
    }
    if (linhaEhOpcao12(L)) {
      opcoesSeguidas++;
      indicePrimeiraOpcao = i;
      i--;
      continue;
    }
    break;
  }

  if (opcoesSeguidas >= 2 && indicePrimeiraOpcao >= 0) {
    let cortar = indicePrimeiraOpcao;
    if (cortar > 0 && linhaEhConviteAlternativas(partes[cortar - 1])) {
      cortar -= 1;
    } else if (cortar > 0) {
      const prev = partes[cortar - 1].trim();
      if (prev.endsWith('?')) cortar -= 1;
    }
    partes = partes.slice(0, cortar);
    return sanitizarRespostaGroq(partes.join('\n'));
  }

  if (opcoesSeguidas === 1 && indicePrimeiraOpcao >= 1) {
    const prevLinha = partes[indicePrimeiraOpcao - 1];
    const prev = prevLinha.trim();
    if (prev.endsWith('?') || linhaEhConviteAlternativas(prevLinha)) {
      partes = partes.slice(0, indicePrimeiraOpcao - 1);
      return sanitizarRespostaGroq(partes.join('\n'));
    }
  }

  return partes.join('\n').trim();
}

/** Corpo sanitizado não deve repetir menus “1/2” antes do rodapé do bot. */
export function corpoGroqTemOpcoesConflitantes12(corpo: string): boolean {
  const linhas = corpo.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return linhas.some(l => {
    if (/^[12]\.\s+\S/.test(l)) return false;
    return (
      /^[*_]*\s*[12]\s*[*_]*\s*[)–—:-]\s+\S/.test(l) || /^[12]\)\s+\S/.test(l)
    );
  });
}
