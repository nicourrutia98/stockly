/**
 * @stockly/shared
 *
 * Public entry point for shared TypeScript types + Zod schemas used by both
 * apps/web (Next.js client/server) and the Spring backend (via generated
 * TypeScript clients from OpenAPI, T5).
 *
 * Conventions:
 *  - Every exported Zod schema is suffixed with `z` (e.g. `zProduct`) and a
 *    matching TypeScript type is derived via `z.infer<typeof zProduct>`.
 *  - API responses use snake_case-over-the-wire but camelCase in TS code; the
 *    wire mapping is handled by generated mappers (T5).
 *  - `createdAt` / `updatedAt` are always ISO 8601 strings in UTC.
 *
 * @since 0.1.0
 */

export * from './types/product.js';
export * from './types/auth.js';
export * from './types/error.js';
export * from './types/api.js';