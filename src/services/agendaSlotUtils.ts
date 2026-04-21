import type { AtendenteAgendaConfig, HorarioBlocoAtendente } from '../types/agendaAtendentes';

/** Slot [s0, s1) cruza almoço [a0, a1)? */
export function slotCruzaAlmoco(
  slotStartMin: number,
  slotDuracaoMin: number,
  almoco: HorarioBlocoAtendente
): boolean {
  const a0 = almoco.inicioH * 60 + almoco.inicioM;
  const a1 = almoco.fimH * 60 + almoco.fimM;
  if (a0 >= a1) return false;
  const s0 = slotStartMin;
  const s1 = slotStartMin + slotDuracaoMin;
  return s0 < a1 && s1 > a0;
}

/** Inícios de slot (hora/minuto locais) dentro de um bloco; fim é exclusivo para encaixe do último atendimento. */
export function horariosEmBloco(b: HorarioBlocoAtendente, intervaloMinutos: number): { h: number; m: number }[] {
  const out: { h: number; m: number }[] = [];
  const start = b.inicioH * 60 + b.inicioM;
  const end = b.fimH * 60 + b.fimM;
  for (let cur = start; cur + intervaloMinutos <= end; cur += intervaloMinutos) {
    out.push({ h: Math.floor(cur / 60), m: cur % 60 });
  }
  return out;
}

/** União ordenada dos horários de todos os blocos de um atendente (sem duplicar o mesmo minuto). */
export function slotsDoAtendenteNoDia(at: AtendenteAgendaConfig): { h: number; m: number }[] {
  const seen = new Set<string>();
  const ordered: { h: number; m: number }[] = [];
  for (const b of at.blocos) {
    for (const hm of horariosEmBloco(b, at.intervaloMinutos)) {
      const k = `${hm.h}:${hm.m}`;
      if (!seen.has(k)) {
        seen.add(k);
        ordered.push(hm);
      }
    }
  }
  ordered.sort((a, b) => a.h * 60 + a.m - (b.h * 60 + b.m));

  const almoco = at.almoco;
  if (!almoco) return ordered;

  return ordered.filter((hm) => {
    const startMin = hm.h * 60 + hm.m;
    return !slotCruzaAlmoco(startMin, at.intervaloMinutos, almoco);
  });
}
