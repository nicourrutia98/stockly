/**
 * Renderiza cada lamina del deck a PNG para revision visual.
 *   node scripts/shoot-deck.mjs [directorio-salida]
 * Requiere el deck construido: python3 docs/presentacion/build.py
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DECK = path.resolve(here, '../../../docs/presentacion/index.html');
const argv = process.argv.slice(2);
const OUT = argv.find((a) => !a.startsWith('--'))
  ? path.resolve(argv.find((a) => !a.startsWith('--')))
  : path.resolve(here, '../../../docs/presentacion/revision');

if (!existsSync(DECK)) {
  console.error('No existe el deck. Construyelo primero:\n  python3 docs/presentacion/build.py');
  process.exit(1);
}

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));

await page.goto('file://' + DECK, { waitUntil: 'load' });
await page.waitForTimeout(600);

const total = await page.locator('section.slide').count();
console.log(`laminas: ${total}`);

for (let n = 1; n <= total; n++) {
  await page.evaluate((i) => {
    document.querySelectorAll('.slide').forEach((s, k) => s.classList.toggle('on', k === i));
  }, n - 1);
  await page.waitForTimeout(220);
  await page.screenshot({ path: path.join(OUT, `lamina-${String(n).padStart(2, '0')}.png`) });
  process.stdout.write(`${n} `);
}

await browser.close();
console.log('\n->', OUT);
if (errors.length) {
  console.log('errores:');
  for (const e of [...new Set(errors)]) console.log('  ' + e);
  process.exitCode = 1;
} else {
  console.log('sin errores de consola.');
}

/* ------------------------------------------------------------------
   Con --pdf ademas exporta una copia lista para entregar o proyectar
   sin navegador: una lamina por pagina, horizontal, con las notas del
   expositor al pie de cada una.
   ------------------------------------------------------------------ */
if (process.argv.includes('--pdf')) {
  const pdf = path.resolve(here, '../../../docs/presentacion/Stockly-presentacion.pdf');
  const b2 = await chromium.launch({ args: ['--no-sandbox'] });
  const p2 = await b2.newPage();
  await p2.goto('file://' + DECK, { waitUntil: 'load' });
  await p2.waitForTimeout(800);
  await p2.pdf({
    path: pdf,
    width: '1280px',
    height: '720px',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await b2.close();
  console.log('pdf ->', pdf);
}