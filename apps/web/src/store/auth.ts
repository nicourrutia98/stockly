/**
 * Stockly — auth state in memory (Zustand).
 *
 * Why Zustand instead of localStorage?
 *   - XSS surface: `localStorage` is reachable from any script that runs
 *     in the page (including malicious dependencies). The bearer token
 *     must NOT live there.
 *   - The refresh token lives in an HttpOnly cookie that the browser
 *     sends automatically; JavaScript cannot read it.
 *   - The access token lives in this Zustand store, which is in-memory
 *     only. It survives React navigation and TanStack Query re-renders,
 *     but it is gone on full page reload — that is by design. The first
 *     protected request that needs auth will trigger a silent `/refresh`
 *     via the cookie.
 *
 * The store is intentionally minimal: just the access token + the
 * authenticated user. There is no role / preferences / theme (those
 * belong in dedicated stores).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */

import { create } from 'zustand';
import type { User } from '@stockly/shared/types/auth';

/**
 * Auth state slice + actions exposed by the store. Components subscribe
 * via selectors (`useAuth(s => s.accessToken)`) to avoid re-renders on
 * unrelated state changes.
 */
export interface AuthState {
  /** Bearer access token. `null` when the user is not authenticated. */
  accessToken: string | null;
  /** Authenticated user (decoded from the login response). */
  user: User | null;
  /** Status of the initial silent-refresh probe (used by the protected route wrapper). */
  status: 'idle' | 'booting' | 'authenticated' | 'anonymous';
  /** Monotonically increasing counter — incremented on every login/logout to trigger re-fetches. */
  revision: number;

  // -- actions ---------------------------------------------------------------
  setSession: (accessToken: string, user: User) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
  setStatus: (status: AuthState['status']) => void;
}

export const useAuth = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'idle',
  revision: 0,

  setSession: (accessToken, user) =>
    set((s) => ({
      accessToken,
      user,
      status: 'authenticated' as const,
      revision: s.revision + 1,
    })),
  setAccessToken: (accessToken) =>
    set((s) => ({ accessToken, revision: s.revision + 1 })),
  setUser: (user) => set((s) => ({ user, revision: s.revision + 1 })),
  clearSession: () =>
    set((s) => ({
      accessToken: null,
      user: null,
      status: 'anonymous' as const,
      revision: s.revision + 1,
    })),
  setStatus: (status) => set({ status }),
}));

// -- selectors (stable references; recompute cheaply) --------------------------

/** True when an access token is present AND status is authenticated. */
export const selectIsAuthenticated = (s: AuthState): boolean =>
  s.accessToken !== null && s.status === 'authenticated';

/** True while the initial silent refresh is in flight. */
export const selectIsBooting = (s: AuthState): boolean => s.status === 'booting';

/** True when the user has ROLE_ADMIN. */
export const selectIsAdmin = (s: AuthState): boolean => s.user?.role === 'ROLE_ADMIN';

/** Read the current access token without re-rendering on status changes. */
export const selectAccessToken = (s: AuthState): string | null => s.accessToken;