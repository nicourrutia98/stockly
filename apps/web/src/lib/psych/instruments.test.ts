import { describe, expect, it } from 'vitest';

import { GATES, seqScore, susAdjective, susScore, tlxRaw } from './instruments';
import { judgeSession } from './gates';

/**
 * F4 — vectores conocidos de la lib psicométrica.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
describe('SUS (Brooke)', () => {
  it('máximo 100 = positivos en 5 y negativos en 1', () => {
    expect(susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100);
  });
  it('mínimo 0 = positivos en 1 y negativos en 5', () => {
    expect(susScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0);
  });
  it('todo-3 → 50 (neutral exacto)', () => {
    expect(susScore([3, 3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(50);
  });
  it('rechaza largo o rango inválido', () => {
    expect(() => susScore([5, 5])).toThrow(RangeError);
    expect(() => susScore([5, 5, 5, 5, 5, 5, 5, 5, 5, 6])).toThrow(RangeError);
  });
  it('adjetivos Sauro por tramo', () => {
    expect(susAdjective(30)).toBe('pobre');
    expect(susAdjective(60)).toBe('aceptable-bajo');
    expect(susAdjective(GATES.susMin)).toBe('bueno');
    expect(susAdjective(90)).toBe('excelente');
  });
});

describe('SEQ y TLX', () => {
  it('SEQ pasa el valor y valida rango', () => {
    expect(seqScore(6)).toBe(6);
    expect(() => seqScore(0)).toThrow(RangeError);
    expect(() => seqScore(8)).toThrow(RangeError);
  });
  it('Raw TLX es la media', () => {
    expect(tlxRaw([10, 20, 30, 40, 50, 60])).toBe(35);
    expect(() => tlxRaw([1, 2])).toThrow(RangeError);
  });
});

describe('judgeSession', () => {
  it('sesión ejemplar pasa los tres gates', () => {
    const v = judgeSession({
      perf: [{ flow: 'FL-05', runs: 10, passed: 10, durationsMs: [4000] }],
      seqByFlow: { 'FL-05': 6 },
      susResponses: [5, 1, 5, 1, 5, 1, 5, 1, 5, 1],
      tlxScores: [20, 10, 20, 10, 20, 10],
      tlxFlow: 'FL-05',
    });
    expect(v.sus).toBe(100);
    expect(v.overallSuccess).toBe(1);
    expect(v.pass).toBe(true);
  });
  it('SUS bajo tumba el veredicto aunque el éxito sea perfecto', () => {
    const v = judgeSession({
      perf: [{ flow: 'FL-05', runs: 10, passed: 10, durationsMs: [4000] }],
      seqByFlow: { 'FL-05': 2 },
      susResponses: [1, 5, 1, 5, 1, 5, 1, 5, 1, 5],
      tlxScores: [90, 90, 90, 90, 90, 90],
      tlxFlow: 'FL-05',
    });
    expect(v.sus).toBe(0);
    expect(v.pass).toBe(false);
    expect(v.flows[0].seqOk).toBe(false);
  });
});
