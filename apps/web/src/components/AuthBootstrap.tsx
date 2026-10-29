/**
 * Stockly — one-shot auth bootstrap.
 *
 * Runs the silent `/auth/refresh` probe once per full page load so the
 * header can show the real session (Panel + Salir) without waiting for a
 * protected route. Skipped on /login and /register: there is nothing to
 * restore and it would only add a guaranteed 401.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { bootstrapAuth } from '../lib/api/auth-api';
import { useAuth } from '../store/auth';

const AUTH_PATHS = new Set(['/login', '/register']);

export function AuthBootstrap() {
  const pathname = usePathname();

  useEffect(() => {
    if (AUTH_PATHS.has(pathname ?? '')) return;
    if (useAuth.getState().status === 'idle') void bootstrapAuth();
  }, [pathname]);

  return null;
}
