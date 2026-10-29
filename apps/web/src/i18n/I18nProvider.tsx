/**
 * Stockly — client i18n provider.
 *
 * Initial locale comes from the server (cookie) so SSR and hydration
 * agree; switching updates state immediately, persists the cookie and
 * refreshes Server Components so `<html lang>` and server text follow.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { translate } from './index';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  type Locale,
  type MessageKey,
  type MessageVars,
  type TFunction,
} from './types';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function I18nProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      if (typeof document !== 'undefined') {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
      }
      // Re-render Server Components with the new cookie.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: MessageKey, vars?: MessageVars) => translate(locale, key, vars),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (ctx === null) {
    throw new Error('useI18n must be used inside <I18nProvider> (see app/layout.tsx).');
  }
  return ctx;
}

export function useT(): TFunction {
  return useI18n().t;
}
