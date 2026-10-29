import { request } from '@playwright/test';

/**
 * Helpers API para seed/limpieza (F2). Hablan directo al backend Spring,
 * sin pasar por la UI: los tests de UI nunca deben depender de otros tests.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
export const API = process.env.E2E_API_URL ?? 'http://localhost:8080/api/v1';
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@stockly.co';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Admin1234';

export interface SeedProduct {
  id: number;
  sku: string;
}

export async function loginAdmin(): Promise<{ accessToken: string; cookie: string }> {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!res.ok()) {
    throw new Error(`loginAdmin falló: ${res.status()} — ¿seed del admin en pg5433?`);
  }
  const body = await res.json();
  const setCookie = res.headers()['set-cookie'] ?? '';
  const match = /stockly_rt=[^;]+/.exec(setCookie);
  await ctx.dispose();
  return { accessToken: body.accessToken as string, cookie: match ? match[0] : '' };
}

/** SKU único por test para aislamiento total (sin colisiones entre workers). */
export function uniqueSku(prefix = 'E2E'): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`.slice(0, 32);
}

export async function createProductSeed(
  accessToken: string,
  overrides: Record<string, unknown> = {},
): Promise<SeedProduct> {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API}/products`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      sku: uniqueSku(),
      name: 'Producto seed E2E',
      price: 9999.99,
      stock: 5,
      category: 'E2E',
      ...overrides,
    },
  });
  if (res.status() !== 201) {
    throw new Error(`createProductSeed falló: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  await ctx.dispose();
  return { id: body.id as number, sku: body.sku as string };
}

export async function deleteProductSeed(accessToken: string, id: number): Promise<void> {
  const ctx = await request.newContext();
  await ctx.delete(`${API}/products/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  await ctx.dispose();
}
