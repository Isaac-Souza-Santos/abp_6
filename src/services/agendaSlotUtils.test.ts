import { horariosEmBloco, slotCruzaAlmoco, slotsDoAtendenteNoDia } from './agendaSlotUtils';
import type { AtendenteAgendaConfig } from '../types/agendaAtendentes';

describe('slotCruzaAlmoco', () => {
  const almoco = { inicioH: 12, inicioM: 0, fimH: 13, fimM: 0 };

  test('slot before lunch does not cross', () => {
    expect(slotCruzaAlmoco(11 * 60, 30, almoco)).toBe(false);
  });

  test('slot overlapping lunch start crosses', () => {
    expect(slotCruzaAlmoco(11 * 60 + 45, 30, almoco)).toBe(true);
  });

  test('slot inside lunch crosses', () => {
    expect(slotCruzaAlmoco(12 * 60 + 15, 30, almoco)).toBe(true);
  });
});

describe('slotsDoAtendenteNoDia with almoco', () => {
  const base: AtendenteAgendaConfig = {
    id: 'a',
    nome: 'Test',
    intervaloMinutos: 30,
    blocos: [
      { inicioH: 9, inicioM: 0, fimH: 12, fimM: 0 },
      { inicioH: 14, inicioM: 0, fimH: 17, fimM: 0 },
    ],
    almoco: { inicioH: 12, inicioM: 0, fimH: 13, fimM: 0 },
  };

  test('removes slots that overlap lunch', () => {
    const slots = slotsDoAtendenteNoDia(base);
    const has1130 = slots.some((s) => s.h === 11 && s.m === 30);
    const has1145 = slots.some((s) => s.h === 11 && s.m === 45);
    expect(has1130).toBe(true);
    expect(has1145).toBe(false);
  });
});

describe('horariosEmBloco', () => {
  test('respects end boundary', () => {
    const b = { inicioH: 8, inicioM: 0, fimH: 12, fimM: 0 };
    const h = horariosEmBloco(b, 60);
    expect(h.map((x) => `${x.h}:${x.m}`)).toEqual(['8:0', '9:0', '10:0', '11:0']);
  });
});
