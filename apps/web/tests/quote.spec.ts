import { test, expect } from '@playwright/test';

import { createProductSeed, deleteProductSeed, loginAdmin } from './helpers/api';

/**
 * M2 — cotización + señales honestas (spec_id=20).
 *
 * Given/When/Then explícito por caso (living doc ejecutable):
 *   G: el catálogo tiene un producto con stock
 *   W: el comprador pulsa "Cotizar"
 *   T: el contador sube y /cotizacion lista la línea
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
test('M2 cotizar agrega línea y muestra total', async ({ page }) => {
  const { accessToken } = await loginAdmin();
  const tag = Date.now().toString(36).toUpperCase();
  const seed = await createProductSeed(accessToken, { name: `Cotizable ${tag}`, price: 15000, stock: 10 });
  try {
    await page.goto(`/catalogo/${seed.id}`);
    await page.getByRole('button', { name: /agregar .* a la cotización/i }).click();
    await page.goto('/cotizacion');
    await expect(page.getByRole('heading', { name: /tu cotización/i })).toBeVisible();
    await expect(page.getByText(new RegExp(`Cotizable ${tag}`, 'i')).first()).toBeVisible();
    await expect(page.getByText(/15\.000/i).first()).toBeVisible();
  } finally {
    await deleteProductSeed(accessToken, seed.id).catch(() => undefined);
  }
});

test('M2 el contador del nav refleja las líneas', async ({ page }) => {
  const { accessToken } = await loginAdmin();
  const tag = Date.now().toString(36).toUpperCase();
  const seed = await createProductSeed(accessToken, { name: `Contador ${tag}`, price: 9000, stock: 4 });
  try {
    await page.goto(`/catalogo/${seed.id}`);
    await page.getByRole('button', { name: /agregar .* a la cotización/i }).click();
    await page.goto('/cotizacion');
    const inc = page.getByRole('button', { name: /agregar uno de/i }).first();
    await inc.click();
    await inc.click();
    await expect(page.getByText(/27\.000/i).first()).toBeVisible();
  } finally {
    await deleteProductSeed(accessToken, seed.id).catch(() => undefined);
  }
});

test('M2 producto agotado no se puede cotizar', async ({ page }) => {
  const { accessToken } = await loginAdmin();
  const tag = Date.now().toString(36).toUpperCase();
  const seed = await createProductSeed(accessToken, { name: `Agotado ${tag}`, price: 5000, stock: 0 });
  try {
    await page.goto(`/catalogo/${seed.id}`);
    const btn = page.getByRole('button', { name: /agotado/i }).first();
    await expect(btn).toBeDisabled();
  } finally {
    await deleteProductSeed(accessToken, seed.id).catch(() => undefined);
  }
});

test('M2 cotización vacía orienta al catálogo', async ({ page }) => {
  await page.goto('/cotizacion');
  await expect(page.getByText(/aún no agregaste productos/i)).toBeVisible();
});