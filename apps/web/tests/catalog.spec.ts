import { test, expect } from '@playwright/test';

import {
  createProductSeed,
  deleteProductSeed,
  loginAdmin,
  uniqueSku,
} from './helpers/api';

/**
 * M1 — storefront público (spec_id=20). Sin login: catálogo, búsqueda,
 * detalle y 404. Seed y limpieza por API.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
test('M1 catálogo lista productos con precio y disponibilidad', async ({ page }) => {
  const { accessToken } = await loginAdmin();
  const tag = Date.now().toString(36).toUpperCase();
  const seed = await createProductSeed(accessToken, { name: `Café Catálogo ${tag}`, category: 'Café y Bebidas' });
  try {
    await page.goto('/catalogo');
    await expect(page.getByRole('heading', { name: 'Catálogo', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(`café catálogo ${tag}`, 'i') }).first()).toBeVisible();
    await expect(page.getByText(/disponible|solo quedan|agotado/i).first()).toBeVisible();
  } finally {
    await deleteProductSeed(accessToken, seed.id).catch(() => undefined);
  }
});

test('M1 buscar filtra por texto', async ({ page }) => {
  const { accessToken } = await loginAdmin();
  const tag = Date.now().toString(36).toUpperCase();
  const sku = uniqueSku('M1B');
  const seed = await createProductSeed(accessToken, { sku, name: `Zarzamora ${tag}`, category: 'Despensa' });
  try {
    await page.goto(`/catalogo?q=${encodeURIComponent(`zarzamora ${tag}`)}`);
    await expect(page.getByRole('link', { name: new RegExp(`zarzamora ${tag}`, 'i') }).first()).toBeVisible();
    await expect(page.getByText(/1 producto/i)).toBeVisible();
  } finally {
    await deleteProductSeed(accessToken, seed.id).catch(() => undefined);
  }
});

test('M1 detalle muestra precio COP y vuelve al catálogo', async ({ page }) => {
  const { accessToken } = await loginAdmin();
  const tag = Date.now().toString(36).toUpperCase();
  const seed = await createProductSeed(accessToken, { name: `Miel Detalle ${tag}`, price: 27000, category: 'Despensa' });
  try {
    await page.goto(`/catalogo/${seed.id}`);
    await expect(page.getByRole('heading', { name: new RegExp(`miel detalle ${tag}`, 'i') })).toBeVisible();
    await expect(page.getByText(/27\.?000/i).first()).toBeVisible();
    await page.getByRole('link', { name: /volver al catálogo/i }).click();
    await expect(page).toHaveURL(/\/catalogo\/?$/);
  } finally {
    await deleteProductSeed(accessToken, seed.id).catch(() => undefined);
  }
});

test('M1 id inexistente da 404', async ({ page }) => {
  const res = await page.goto('/catalogo/999999');
  expect(res?.status()).toBe(404);
});
