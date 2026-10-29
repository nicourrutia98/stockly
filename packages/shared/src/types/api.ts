/**
 * Generic API envelope types.
 *
 * Paged responses across the API follow Spring's `Page<T>` shape, which is
 * exposed as JSON via Spring HATEOAS when needed. For the base CRUD list
 * endpoints we use `zProductPage` (product-specific) so consumers can rely on
 * typed entities.
 *
 * @since 0.1.0
 */

import { z } from 'zod';

/** Cursor-style pagination envelope (used by event/audit feeds, future use). */
export const zCursorPage = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  });

/** Batch operation result envelope (e.g. bulk import, bulk delete). */
export const zBatchResult = z.object({
  totalRequested: z.number().int().min(0),
  succeeded: z.number().int().min(0),
  failed: z.number().int().min(0),
  errors: z.array(
    z.object({
      index: z.number().int().min(0),
      code: z.string(),
      message: z.string(),
    }),
  ),
});
export type BatchResult = z.infer<typeof zBatchResult>;

/** API health probe response. */
export const zHealth = z.object({
  status: z.enum(['UP', 'DOWN', 'OUT_OF_SERVICE', 'UNKNOWN']),
  components: z
    .record(
      z.string(),
      z.object({
        status: z.enum(['UP', 'DOWN']),
        details: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .optional(),
  timestamp: z.string().datetime({ offset: true }).optional(),
});
export type Health = z.infer<typeof zHealth>;

/** Supported API version (negotiated via Accept header). */
export const API_VERSION = 'v1' as const;
export const API_PREFIX = `/api/${API_VERSION}` as const;

/** Locale tags exposed by the backend MessageSource. */
export const zLocale = z.enum(['es-CO', 'en']);
export type Locale = z.infer<typeof zLocale>;

/** Currency display options surfaced in the UI. */
export const zCurrency = z.enum(['USD', 'COP']);
export type Currency = z.infer<typeof zCurrency>;