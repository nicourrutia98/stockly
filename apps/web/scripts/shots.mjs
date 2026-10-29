/**
 * Capturas de pantalla para la presentacion (docs/presentacion/).
 *
 * Uso:  node scripts/shots.mjs
 * Reqs: web en :3000, backend en :8080, postgres en :5433, redis en :6379.
 * Salida: assets/presentacion/*.png  (fondo transparente -> las láminas los
 * montan sobre el color de marca).
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), 'assets/presentacion');
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
// Credenciales del seed de DESARROLLO. Se pueden sobrescribir por variables de
// entorno para no dejar credenciales escritas en el repositorio.
const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@stockly.co',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'Admin1234',
};

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: 'es-CO',
  timezoneId: 'America/Bogota',
  colorScheme: 'light',
});
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(`${page.url()} :: ${e.message}`));

async function shot(name, path_, opts = {}) {
  await page.goto(BASE + path_, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.waitForTimeout(opts.settle ?? 900);
  if (opts.before) await opts.before(page);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  console.log(`  ${name}.png  <-  ${path_}`);
}

console.log('capturando…');

// 1. Landing publica
await shot('01-landing', '/');

// 2. Catalogo publico (la tienda, sin cuenta)
await shot('02-catalogo', '/catalogo');

// 3. Detalle de producto publico
await shot('03-catalogo-detalle', '/catalogo/39');

// 4. Carrito/cotizacion vacio
await shot('04-cotizacion', '/cotizacion');

// 5. Login
await shot('05-login', '/login');

// 6. Autenticar por la UI (flujo real FL-03)
await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
await page.getByLabel(/correo|email/i).first().fill(ADMIN.email);
await page.getByLabel(/contrase|password/i).first().fill(ADMIN.password);
await page.getByRole('button', { name: /entrar|iniciar|sign in/i }).first().click();
await page.waitForURL(/\/admin/, { timeout: 30_000 });
console.log('  login ok ->', page.url());

// 7. Dashboard con KPIs
await shot('06-admin-dashboard', '/admin', { settle: 1400 });

// 8. Tabla de productos con filtros
await shot('07-admin-productos', '/admin/products', { settle: 1400 });

// 9. Detalle administrativo
await shot('08-admin-detalhe', '/admin/products/39', { settle: 1200 });

// 10. Autoria y licencia
await shot('09-about-autores', '/about');

// 11. 404
await shot('10-not-found', '/ruta-que-no-existe', { settle: 700 });

await browser.close();

if (errors.length) {
  console.log('\npageerror en consola:');
  for (const e of errors) console.log('  ' + e);
  process.exitCode = 1;
} else {
  console.log('\nsin pageerror en consola.');
}