/**
 * Stockly — auth REST API surface.
 *
 * Wraps the Spring auth endpoints:
 *   - POST /api/v1/auth/login    → AuthTokens (sets refresh cookie)
 *   - POST /api/v1/auth/refresh  → AuthTokens (rotates; may also be set by cookie)
 *   - POST /api/v1/auth/logout   → 204 (revokes the current refresh JTI)
 *   - GET  /api/v1/auth/me       → User (requires Bearer access)
 *
 * On a successful login/refresh, the function ALSO updates the Zustand
 * auth store so that subsequent `apiFetch` calls automatically include
 * the new bearer token.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */

import {
  zAuthTokens,
  zRegisterRequest,
  zUser,
  type AuthTokens,
  type LoginRequest,
  type RegisterRequest,
  type User,
} from '@stockly/shared/types/auth';

import { api } from './client';
import { ApiError } from './api-error';
import { useAuth } from '../../store/auth';

/**
 * Creates an account via `POST /auth/register`.
 *
 * The backend returns the public `User` (no tokens): registration does not
 * auto-login, so the UI redirects to `/login` after success.
 */
export async function register(body: RegisterRequest): Promise<User> {
  return api.post<User>('/auth/register', {
    jsonBody: body,
    schema: zUser,
    skipCredentials: true,
  });
}

/**
 * Sends `email` + `password` to `/auth/login`, stores the resulting
 * access token + user in the auth store, and returns the parsed
 * AuthTokens payload.
 *
 * Side effect: also populates the Zustand auth store so subsequent
 * TanStack Query hooks can read the new access token immediately.
 */
export async function login(body: LoginRequest): Promise<AuthTokens> {
  const tokens = await api.post<AuthTokens>('/auth/login', {
    jsonBody: body,
    schema: zAuthTokens,
    skipCredentials: false,
  });
  useAuth.getState().setSession(tokens.accessToken, tokens.user);
  return tokens;
}

/**
 * Asks the backend to rotate the refresh cookie. The HttpOnly cookie
 * travels automatically thanks to `credentials: 'include'` (the default).
 *
 * On success, the new access token replaces the old one in the auth
 * store; the caller does not need to do anything else.
 *
 * On failure (expired/revoked/blacklisted), clears the auth store and
 * returns `null`.
 */
export async function refresh(): Promise<AuthTokens | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const tokens = await api.post<AuthTokens>('/auth/refresh', {
        schema: zAuthTokens,
      });
      useAuth.getState().setSession(tokens.accessToken, tokens.user);
      return tokens;
    } catch (error) {
      // 401/403 are definitive (expired, revoked or reused). Network errors,
      // timeouts and 5xx are transient: retry once before dropping the
      // session, otherwise a blip on reload looks like a logout.
      const transient =
        error instanceof ApiError &&
        (error.status === 0 || error.status === 408 || error.status >= 500);
      if (transient && attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }
      useAuth.getState().clearSession();
      return null;
    }
  }
  return null;
}

/**
 * Revokes the current refresh JTI (server-side) AND clears the local
 * auth store. Idempotent — safe to call when the user is already
 * logged out.
 */
export async function logout(): Promise<void> {
  try {
    await api.post<void>('/auth/logout', {
      schema: undefined,
    });
  } finally {
    useAuth.getState().clearSession();
  }
}

/**
 * Fetches the currently-authenticated user from `/auth/me`. Uses the
 * access token from the auth store (or the override passed in `init`).
 *
 * If the request 401s, the auth store is cleared by `apiFetch`; the
 * caller can detect this via the thrown `ApiError`.
 */
export async function me(): Promise<User> {
  return api.get<User>('/auth/me', {
    schema: zUser,
  });
}

/**
 * One-shot initializer used by the React app on mount. Tries a silent
 * refresh via the cookie; if it succeeds, the store becomes
 * authenticated. Otherwise it stays anonymous.
 */
/**
 * Dedupe for every silent refresh (bootstrap probe OR a 401 retry).
 *
 * On a hard reload both `<AuthBootstrap>` (global) and `<ProtectedRoute>`
 * observe `status === 'idle'` and would call this function in the same
 * tick. Two concurrent `POST /auth/refresh` requests carry the same
 * refresh cookie; the backend rotates on first use, so the second one is
 * a token-reuse signal and can blacklist the session. Sharing one
 * in-flight promise keeps the rotation single-shot.
 */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Forces (or joins) a silent session refresh.
 *
 * Used by `apiFetch` after a 401 so the retry shares the same rotation as
 * the bootstrap probe instead of starting a second one with the same
 * single-use cookie.
 *
 * @returns true when the auth store now holds a fresh session
 */
export function refreshSession(): Promise<boolean> {
  if (refreshInFlight !== null) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const tokens = await refresh();
    if (tokens === null) {
      useAuth.getState().setStatus('anonymous');
      return false;
    }
    useAuth.getState().setStatus('authenticated');
    return true;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

/**
 * Silent session restore: rotates the refresh cookie (HttpOnly) and
 * repopulates the in-memory access token.
 *
 * @returns true when a session was restored, false when anonymous
 */
export function bootstrapAuth(): Promise<boolean> {
  if (useAuth.getState().status === 'authenticated') {
    return Promise.resolve(true);
  }
  if (refreshInFlight !== null) {
    return refreshInFlight;
  }
  useAuth.getState().setStatus('booting');
  return refreshSession();
}