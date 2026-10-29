/**
 * FE-T5 — visual validation captures.
 *
 * Logs in as admin and screenshots every new surface:
 *   /admin (dashboard), /admin/products, product detail,
 *   /admin/products/new, 404 route and the loading state.
 *
 * Output: /home/usco/Desktop/urrutia/ia 1 oc/apps/web/.fe5-shots/
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE = 'http://localhost:3000';
const OUT = '/home/usco/Desktop/urrutia/ia 1 oc/apps/web/.fe5-shots';

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const shot = async (name) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(`shot: ${name}.png — ${page.url().replace(BASE, '')}`);
};

const axe = async (label) => {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const grave = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
  console.log(`axe ${label}: ${grave.length}`, grave.map((v) => `${v.id}:${v.nodes.length}`).join(','));
};

// 1. Landing + login
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await shot('01-landing');
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await shot('02-login');

// 2. Login as admin (credenciales del seed de desarrollo; sobrescribibles)
await page.getByLabel(/email/i).fill(process.env.E2E_ADMIN_EMAIL ?? 'admin@stockly.co');
await page.getByLabel(/contraseña/i).fill(process.env.E2E_ADMIN_PASSWORD ?? 'Admin1234');
await page.getByRole('button', { name: /entrar/i }).click();
await page.waitForURL(/\/admin\/products/, { timeout: 30_000 });
await page.waitForTimeout(1500);
await shot('03-admin-products');
await axe('03-admin-products');

// 3. Dashboard (FE-T5)
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: /panel/i }).first().waitFor({ timeout: 30_000 });
await page.waitForTimeout(2500);
console.log('KPI cards:', (await page.locator('.mantine-Paper-root').allTextContents()).slice(0, 6));
await shot('04-admin-dashboard');
await axe('04-admin-dashboard');

// 4. Detail (FE-T4) from dashboard low-stock link
const firstLink = page.locator('a[href^="/admin/products/"]:not([href$="/new"])').first();
if (await firstLink.count()) {
  await firstLink.click();
  await page.waitForURL(/\/admin\/products\/\d+$/, { timeout: 30_000 });
  await page.waitForTimeout(1500);
  await shot('05-admin-detail');
  await axe('05-admin-detail');
}

// 5. Create form
await page.goto(`${BASE}/admin/products/new`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await shot('06-admin-new');

// 6. 404
await page.goto(`${BASE}/ruta-que-no-existe`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
console.log('404 heading:', (await page.locator('h1').first().textContent())?.trim());
await shot('07-not-found');
await axe('07-not-found');

// 7. Loading state: throttle CPU/network then navigate to the dashboard
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 400,
  downloadThroughput: (500 * 1024) / 8,
  uploadThroughput: (250 * 1024) / 8,
});
await page.goto(`${BASE}/admin`, { waitUntil: 'commit' });
await page.waitForTimeout(600);
await shot('08-admin-loading');
await page.waitForTimeout(6000);

console.log('page errors:', errors.length ? errors : 'none');
await browser.close();
console.log(`\nCapturas en: ${OUT}`);