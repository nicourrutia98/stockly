/**
 * Stockly — instrumentos psicométricos (F4, spec_id=13).
 *
 * Fuentes: Brooke SUS (1986), SEQ post-tarea (Sauro), NASA-TLX Raw
 * (Hart & Stavelson; se usa Raw TLX sin pesos pareados — práctica SOTA
 * por su equivalencia psicométrica y menor carga al participante).
 *
 * Todo puro TypeScript sin dependencias: puntuable en front, back o CLI.
 * Escalas Likert 1-5 (SUS) / 1-7 (SEQ) / 0-100 (TLX).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */

/** Umbrales-gate del proyecto (ver docs/F4-protocolo-sesion.md). */
export const GATES = {
  /** Benchmark SUS (Sauro): 68 = promedio industrial. */
  susMin: 68,
  /** Tasa de éxito mínima por flujo. */
  successMin: 0.9,
  /** SEQ 1-7: bajo 5 indica fricción a investigar. */
  seqWarnBelow: 5,
  /** Raw TLX 0-100: sobre 60 = carga alta. */
  tlxWarnAbove: 60,
} as const;

/** 10 ítems SUS (ES). Impares = tono positivo, pares = negativo (Brooke). */
export const SUS_ITEMS: readonly string[] = [
  'Creo que usaría Stockly con frecuencia.',
  'Stockly me pareció innecesariamente complejo.',
  'Stockly me pareció fácil de usar.',
  'Creo que necesitaría ayuda técnica para usar Stockly.',
  'Las funciones de Stockly están bien integradas.',
  'Encontré demasiadas inconsistencias en Stockly.',
  'La mayoría aprendería a usar Stockly rápido.',
  'Stockly me pareció engorroso de usar.',
  'Me sentí seguro usando Stockly.',
  'Necesité aprender mucho antes de usar Stockly.',
];

/**
 * Puntaje SUS 0-100 (Brooke): ímpares (respuesta-1), pares (5-respuesta),
 * suma × 2.5. `responses` = 10 enteros 1-5 en orden de SUS_ITEMS.
 */
export function susScore(responses: readonly number[]): number {
  if (responses.length !== 10 || responses.some((r) => !Number.isInteger(r) || r < 1 || r > 5)) {
    throw new RangeError('SUS requiere 10 respuestas enteras 1-5');
  }
  const sum = responses.reduce((acc, r, i) => acc + (i % 2 === 0 ? r - 1 : 5 - r), 0);
  return sum * 2.5;
}

/** Adjetivo Sauro para un puntaje SUS (reporte legible). */
export function susAdjective(score: number): string {
  if (score < 51) return 'pobre';
  if (score < 68) return 'aceptable-bajo';
  if (score < 80.3) return 'bueno';
  return 'excelente';
}

/** SEQ: 1 ítem post-tarea 1-7 ("En general, la tarea fue fácil"). Pasa tal cual. */
export function seqScore(response: number): number {
  if (!Number.isInteger(response) || response < 1 || response > 7) {
    throw new RangeError('SEQ requiere un entero 1-7');
  }
  return response;
}

/** 6 subescalas NASA-TLX (ES). */
export const TLX_SCALES: readonly string[] = [
  'Exigencia mental',
  'Exigencia física',
  'Exigencia temporal',
  'Rendimiento (0=perfecto, 100=fracaso)',
  'Esfuerzo',
  'Frustración',
];

/**
 * Raw TLX = media de las 6 subescalas 0-100. Mayor = más carga.
 * Nota: Rendimiento va invertido por definición (0 bueno); quien captura
 * debe ingresarlo ya en esa polaridad.
 */
export function tlxRaw(scores: readonly number[]): number {
  if (scores.length !== 6 || scores.some((s) => typeof s !== 'number' || s < 0 || s > 100)) {
    throw new RangeError('TLX requiere 6 valores 0-100');
  }
  return scores.reduce((a, b) => a + b, 0) / 6;
}
