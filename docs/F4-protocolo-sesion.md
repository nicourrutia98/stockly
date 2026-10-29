# F4 — Protocolo de sesión psicométrica · Stockly (spec_id=13)

Medimos **performance objetiva** (automática, reporter `psych-perf.json`) +
**percepción subjetiva** (humana, este protocolo). NN/g: una sin la otra no significa nada.

## 1. Preparación (5 min)
1. Backend `:8080` + front `:3000` arriba; staging limpio (purga `category E2E`).
2. Cronómetro visible. Participante: cliente real o compañero (no el dev).
3. Guion = matriz F3 en orden: FL-03 → FL-04 → FL-05 → FL-06 → FL-07.

## 2. Por cada flujo (participante ejecuta, facilitador observa en silencio)
1. Lee la tarea en voz alta ("entra con admin@stockly.co…", "crea un café a 12500…").
2. Ejecuta sin ayuda. Registra: **éxito (sí/no)** + **tiempo (s)**.
3. Al terminar, responde **SEQ** (1-7): *"En general, esta tarea fue fácil."*
   - SEQ < 5 → anotar qué trabó (cita textual si es posible).

## 3. Cierre (10 min)
1. **SUS**: 10 ítems (`SUS_ITEMS` en `src/lib/psych/instruments.ts`), escala 1-5,
   sin pensar demasiado, sin saltar ítems.
2. **NASA-TLX** sobre el flujo más pesado (normalmente FL-05/FL-06):
   6 escalas 0-100 (mental, física, temporal, rendimiento 0=perfecto, esfuerzo, frustración).

## 4. Puntuación (automática)
```ts
import { judgeSession } from './src/lib/psych/gates';
// perf: copiar bloques de test-results/psych-perf.json de la corrida CI;
// seqByFlow/susResponses/tlxScores: respuestas del participante.
const verdict = judgeSession({ perf, seqByFlow, susResponses, tlxScores, tlxFlow: 'FL-05' });
```

## 5. Gates (no negociables para declarar el flujo "intuitivo")
| Gate | Umbral | Fuente |
|---|---|---|
| Éxito global | ≥ 90% | F4 |
| SUS | ≥ 68 (`bueno` Sauro) | Brooke/Sauro |
| TLX flujo pico | ≤ 60 | Hart (raw) |
| SEQ por flujo | ≥ 5, si no → hallazgo a corregir | Sauro |

`verdict.pass === true` exige los tres primeros; cada SEQ < 5 abre un hallazgo
aunque el resto pase.
