/**
 * Stockly — products REST API surface.
 *
 * Wraps Spring ProductController (T5):
 *   GET /products, GET /products/{id}, POST /products,
 *   PATCH /products/{id}, DELETE /products/{id}
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import {
  zProduct,
  zProductPage,
  type CreateProduct,
  type Product,
  type ProductPage,
  type ProductPageQuery,
  type UpdateProduct,
} from '@stockly/shared/types/product';
import { z } from 'zod';

import { api } from './api/client';

function toQuery(params: ProductPageQuery): string {
  const sp = new URLSearchParams();
  sp.set('page', String(params.page));
  sp.set('size', String(params.size));
  sp.set('sort', `${params.sort},${params.direction}`);
  if (params.category) sp.set('category', params.category);
  if (typeof params.active === 'boolean') sp.set('active', String(params.active));
  if (params.q) sp.set('search', params.q);
  if (params.inStockOnly) sp.set('inStockOnly', 'true');
  return `?${sp.toString()}`;
}

export async function listProducts(q: ProductPageQuery): Promise<ProductPage> {
  return api.get<ProductPage>(`/products${toQuery(q)}`, { schema: zProductPage });
}

export async function getProduct(id: number): Promise<Product> {
  return api.get<Product>(`/products/${id}`, { schema: zProduct });
}

export async function createProduct(body: CreateProduct): Promise<Product> {
  return api.post<Product>('/products', { jsonBody: body, schema: zProduct });
}

export async function updateProduct(id: number, body: UpdateProduct): Promise<Product> {
  return api.patch<Product>(`/products/${id}`, { jsonBody: body, schema: zProduct });
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete<void>(`/products/${id}`, { schema: z.unknown() });
}
