/**
 * Product domain types + Zod schemas.
 *
 * Wire shape (matches the Spring ProductController contract drafted in T5):
 *
 *   {
 *     id:         number  (server-assigned),
 *     sku:        string  ([A-Z0-9-]{3,32}),
 *     name:       string  (1..200),
 *     description?: string (0..2000),
 *     price:      number  (> 0, 2 decimals),
 *     stock:      integer (>= 0),
 *     category:   string  (1..64),
 *     active:     boolean (default true),
 *     createdAt:  string  (ISO 8601 UTC),
 *     updatedAt:  string  (ISO 8601 UTC)
 *   }
 *
 * @since 0.1.0
 */

import { z } from 'zod';
import { zCurrency, type Currency } from './api.js';

// Re-export so callers can `import { zCurrency, type Currency } from '@stockly/shared/types/product'`
// without caring which file originally defined it.
export { zCurrency, type Currency };

/** SKU pattern: uppercase letters, digits, and dashes. 3..32 chars. */
export const zSku = z
  .string()
  .min(3, 'SKU must be at least 3 characters')
  .max(32, 'SKU cannot exceed 32 characters')
  .regex(/^[A-Z0-9-]+$/, 'SKU may only contain uppercase letters, digits, and dashes');

/**
 * Schema for creating a product. The server assigns `id`, `createdAt`, and
 * `updatedAt`; the client never sends them.
 */
export const zCreateProduct = z.object({
  sku: zSku,
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name cannot exceed 200 characters'),
  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than zero')
    .finite('Price must be finite')
    .multipleOf(0.01, 'Price supports at most 2 decimal places'),
  stock: z
    .number({ invalid_type_error: 'Stock must be an integer' })
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(64, 'Category cannot exceed 64 characters'),
  active: z.boolean().default(true),
});

/**
 * Schema for partial updates (PATCH /api/v1/products/{id}).
 *
 * Semantics follow RFC 7396 (JSON Merge Patch):
 *  - Field absent (undefined)  → keep current value (no change).
 *  - Field present with `null` → clear the field (only meaningful for nullable columns).
 *  - Field present with value  → overwrite.
 *
 * Rationale per field:
 *  - `description` is the only nullable column on the entity, so it accepts
 *    `.nullable().optional()`. Sending `null` clears the description; omitting
 *    the key leaves it untouched.
 *  - `name`, `category`, `price`, `stock`, `active`, `sku` are non-null in storage;
 *    they accept `.optional()` only (no null). The refine at the bottom rejects
 *    payloads that contain no updatable fields.
 *
 * At least one field must be present and not-undefined (enforced by `.refine`).
 */
export const zUpdateProduct = z
  .object({
    sku: zSku.optional(),
    name: z
      .string()
      .min(1, 'Name is required')
      .max(200, 'Name cannot exceed 200 characters')
      .optional(),
    description: z
      .string()
      .max(2000, 'Description cannot exceed 2000 characters')
      .nullable()
      .optional(),
    price: z
      .number()
      .positive('Price must be greater than zero')
      .finite('Price must be finite')
      .multipleOf(0.01, 'Price supports at most 2 decimal places')
      .optional(),
    stock: z
      .number()
      .int('Stock must be an integer')
      .min(0, 'Stock cannot be negative')
      .optional(),
    category: z
      .string()
      .min(1, 'Category is required')
      .max(64, 'Category cannot exceed 64 characters')
      .optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: 'At least one field must be provided for an update' },
  );

/** Full product representation returned by the API. */
export const zProduct = zCreateProduct.extend({
  id: z.number().int().positive(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

/** Pagination query parameters for GET /api/v1/products. */
export const zProductPageQuery = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['name', 'price', 'stock', 'updatedAt'])
    .default('updatedAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
  category: z.string().max(64).optional(),
  active: z.coerce.boolean().optional(),
  q: z.string().max(100).optional(),
  /** Mirrors Spring `ProductSearchCriteria.inStockOnly` (stock > 0). */
  inStockOnly: z.boolean().optional(),
});

/** Paginated response envelope (Spring `Page<T>` shape, T5 backend v0.1.0).
 *
 * `first`/`last` son opcionales: el backend no los serializa; se derivan
 * como `page === 0` y `page >= totalPages - 1` cuando falten. */
export const zProductPage = z.object({
  // Acotado a 100: ver CVE-2023-54404 (array sin cota) y
  // spring.data.web.pageable.max-page-size=100 del backend.
  content: z.array(zProduct).max(100),
  page: z.number().int().min(0),
  size: z.number().int().min(1),
  totalElements: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  first: z.boolean().optional(),
  last: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Inferred TypeScript types. Prefer importing these over hand-rolled interfaces
// so the wire contract stays in sync with the Zod schema.
// ---------------------------------------------------------------------------

export type CreateProduct = z.infer<typeof zCreateProduct>;
export type UpdateProduct = z.infer<typeof zUpdateProduct>;
export type Product = z.infer<typeof zProduct>;
export type ProductPage = z.infer<typeof zProductPage>;
export type ProductPageQuery = z.infer<typeof zProductPageQuery>;