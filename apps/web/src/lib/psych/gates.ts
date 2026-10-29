/**
 * Stockly — agregación y gates psicométricos (F4, spec_id=13).
 *
 * Une performance automática (reporter Playwright → psych-perf.json)
 * con self-report humano (protocolo docs/F4-protocolo-sesion.md).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import { GATES, seqScore, susAdjective, susScore, tlxRaw } from './instruments';

export interface FlowPerf {
  flow: string;
  runs: number;
  passed: number;
  /** ms por intento. */
  durationsMs: number[];
}

export interface FlowReport extends FlowPerf {
  successRate: number;
  meanMs: number;
  seq?: number;
  seqOk?: boolean;
}

export interface SessionInput {
  perf: FlowPerf[];
  /** Clave = flujo (FL-03…), valor = respuesta SEQ 1-7. */
  seqByFlow: Record<string, number>;
  /** 10 respuestas SUS 1-5. */
  susResponses: readonly number[];
  /** 6 valores TLX 0-100 del flujo de mayor carga. */
  tlxScores: readonly number[];
  tlxFlow: string;
}

export interface SessionVerdict {
  flows: FlowReport[];
  sus: number;
  susLabel: string;
  susGate: boolean;
  tlx: number;
  tlxFlow: string;
  tlxGate: boolean;
  overallSuccess: number;
  overallGate: boolean;
  pass: boolean;
}

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function judgeSession(input: SessionInput): SessionVerdict {
  const flows: FlowReport[] = input.perf.map((p) => {
    const successRate = p.runs === 0 ? 0 : p.passed / p.runs;
    const raw = input.seqByFlow[p.flow];
    const seq = raw === undefined ? undefined : seqScore(raw);
    return {
      ...p,
      successRate,
      meanMs: Math.round(mean(p.durationsMs)),
      seq,
      seqOk: seq === undefined ? undefined : seq >= GATES.seqWarnBelow,
    };
  });
  const totalRuns = flows.reduce((a, f) => a + f.runs, 0);
  const totalPassed = flows.reduce((a, f) => a + f.passed, 0);
  const overallSuccess = totalRuns === 0 ? 0 : totalPassed / totalRuns;
  const sus = susScore(input.susResponses);
  const tlx = tlxRaw(input.tlxScores);
  const susGate = sus >= GATES.susMin;
  const tlxGate = tlx <= GATES.tlxWarnAbove;
  const overallGate = overallSuccess >= GATES.successMin;
  return {
    flows,
    sus,
    susLabel: susAdjective(sus),
    susGate,
    tlx: Math.round(tlx * 10) / 10,
    tlxFlow: input.tlxFlow,
    tlxGate,
    overallSuccess: Math.round(overallSuccess * 1000) / 1000,
    overallGate,
    pass: susGate && tlxGate && overallGate,
  };
}
