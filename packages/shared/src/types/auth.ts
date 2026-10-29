/**
 * Authentication domain types + Zod schemas.
 *
 * Auth flow:
 *   1. POST /api/v1/auth/register  → 201 + User (no tokens).
 *   2. POST /api/v1/auth/login     → 200 + AuthTokens (access in JSON,
 *                                   refresh in HttpOnly cookie).
 *   3. POST /api/v1/auth/refresh   → 200 + AuthTokens (rotation, old JTI
 *                                   added to Redis blacklist).
 *   4. POST /api/v1/auth/logout    → 204 (revokes refresh JTI server-side).
 *
 * The access token lives in memory only — never localStorage. See
 * dark-memory spec_id=6 · T6 for the full contract.
 *
 * @since 0.1.0
 */

import { z } from 'zod';

/** Role enum mirrors Spring `com.stockly.auth.domain.Role`. */
export const zRole = z.enum(['ROLE_ADMIN', 'ROLE_USER']);
export type Role = z.infer<typeof zRole>;

/**
 * Public user representation (never includes passwordHash).
 *
 * Mirrors Spring `UserResponse` (T6): `{id, email, role, active}`.
 * `displayName` / `createdAt` / `lastLoginAt` son opcionales porque el
 * backend v0.1.0 no los expone (la tabla `users` no tiene esas columnas);
 * se volverán requeridos cuando el backend los agregue.
 */
export const zUser = z.object({
  id: z.number().int().positive(),
  email: z.string().email().max(254),
  displayName: z.string().min(1).max(120).optional(),
  role: zRole,
  active: z.boolean(),
  createdAt: z.string().datetime({ offset: true }).optional(),
  lastLoginAt: z.string().datetime({ offset: true }).nullable().optional(),
});
export type User = z.infer<typeof zUser>;

/** POST /api/v1/auth/register body. */
export const zRegisterRequest = z.object({
  email: z.string().email().max(254),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a digit'),
  /**
   * Optional: the backend v0.1.0 `users` table has no display-name column,
   * so the field is accepted for forward compatibility but not persisted.
   */
  displayName: z.string().min(1).max(120).optional(),
});
export type RegisterRequest = z.infer<typeof zRegisterRequest>;

/** POST /api/v1/auth/login body. */
export const zLoginRequest = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});
export type LoginRequest = z.infer<typeof zLoginRequest>;

/**
 * Tokens returned by login + refresh.
 *
 * Mirrors Spring `AuthResponse` (T6): el backend serializa
 * `accessTokenExpires` como ISO 8601 (Instant), no segundos.
 */
export const zAuthTokens = z.object({
  accessToken: z.string().min(1),
  accessTokenExpires: z.string().datetime({ offset: true }),
  tokenType: z.literal('Bearer'),
  user: zUser,
});
export type AuthTokens = z.infer<typeof zAuthTokens>;

/** POST /api/v1/auth/refresh body (fallback when cookie is unavailable). */
export const zRefreshRequest = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type RefreshRequest = z.infer<typeof zRefreshRequest>;

/** POST /api/v1/auth/logout body (optional — server reads cookie by default). */
export const zLogoutRequest = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type LogoutRequest = z.infer<typeof zLogoutRequest>;