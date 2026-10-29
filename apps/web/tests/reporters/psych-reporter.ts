import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { writeFileSync } from 'node:fs';

/**
 * Reporter F4: performance objetiva por flujo.
 *
 * Extrae `FL-\d+` del título del test y escribe `test-results/psych-perf.json`
 * con runs/passed/durations por flujo — la mitad objetiva del veredicto
 * (la otra mitad es self-report humano, ver docs/F4-protocolo-sesion.md).
 *
 * Se suma a los reporters existentes sin reemplazarlos.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
interface Bucket {
  runs: number;
  passed: number;
  durationsMs: number[];
}

export default class PsychPerfReporter implements Reporter {
  private readonly buckets = new Map<string, Bucket>();

  onTestEnd(test: TestCase, result: TestResult) {
    const match = /FL-\d+/.exec(test.title);
    if (!match) return;
    const flow = match[0];
    const b = this.buckets.get(flow) ?? { runs: 0, passed: 0, durationsMs: [] };
    b.runs += 1;
    if (result.status === 'passed') b.passed += 1;
    b.durationsMs.push(result.duration);
    this.buckets.set(flow, b);
  }

  onEnd() {
    const perf = [...this.buckets.entries()].map(([flow, b]) => ({ flow, ...b }));
    writeFileSync('test-results/psych-perf.json', JSON.stringify({ perf }, null, 2));
    for (const p of perf) {
      const rate = p.runs === 0 ? 0 : p.passed / p.runs;
      const mean = Math.round(p.durationsMs.reduce((a, x) => a + x, 0) / Math.max(1, p.durationsMs.length));
      // eslint-disable-next-line no-console
      console.log(`[psych] ${p.flow}: éxito ${(rate * 100).toFixed(0)}% (${p.passed}/${p.runs}) media ${mean}ms`);
    }
  }
}
