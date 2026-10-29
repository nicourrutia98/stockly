/**
 * RFC 7807 Problem Details for HTTP APIs.
 *
 * Mirrors Spring's `org.springframework.http.ProblemDetail` (serialized as
 * application/problem+json) so the frontend can rely on a stable shape for
 * every error response.
 *
 * Extension members (any field beyond the standard set) live in `properties`
 * which Spring renders as top-level keys, but we model them as a free-form
 * record for client-side type safety.
 *
 * @since 0.1.0
 */

import { z } from 'zod';

/** Standard ProblemDetail schema aligned with RFC 7807 §3.1. */
export const zProblemDetail = z.object({
  type: z.string().url().default('about:blank'),
  title: z.string().min(1),
  status: z.number().int().min(100).max(599),
  detail: z.string().optional(),
  instance: z.string().optional(),
  /** Field-level validation errors: field → messages[].
   *
   * Acotado a 20 mensajes por campo: un array sin cota es el patrón vulnerable
   * de CVE-2023-54404 (zod acumula un issue por cada elemento que falla). */
  fieldErrors: z.record(z.string(), z.array(z.string()).max(20)).optional(),
  /** Correlation id so users can quote it in support tickets. */
  correlationId: z.string().optional(),
  /** Free-form extension bag (Spring renders any unknown property here). */
  properties: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime({ offset: true }).optional(),
});

export type ProblemDetail = z.infer<typeof zProblemDetail>;

/**
 * Helper: narrow a generic JSON response. Useful inside TanStack Query error
 * callbacks where the error is `unknown` by default.
 */
export function isProblemDetail(value: unknown): value is ProblemDetail {
  return zProblemDetail.safeParse(value).success;
}

/** Common error codes surfaced by ProblemDetail.title across the API. */
export const zErrorTitle = z.enum([
  'Validation Failed',
  'Resource Not Found',
  'Conflict',
  'Unauthorized',
  'Forbidden',
  'Token Expired',
  'Token Invalid',
  'Internal Server Error',
  'Bad Request',
  'Too Many Requests',
]);

export type ErrorTitle = z.infer<typeof zErrorTitle>;