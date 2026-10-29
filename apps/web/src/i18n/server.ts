/**
 * Stockly — server-side locale resolution.
 *
 * The locale lives in a plain (non-HttpOnly) cookie so Server Components
 * can render the right language on the very first byte. The client
 * provider writes it and calls `router.refresh()` to re-render the tree.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import { cookies } from 'next/headers';

import { translator } from './index';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './types';

export async function getServerLocale(): Promise<Locale> {
  try {
    const store = await cookies();
    const value = store.get(LOCALE_COOKIE)?.value;
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    // Static rendering / edge contexts without a request store.
    return DEFAULT_LOCALE;
  }
}

export async function getServerT() {
  const locale = await getServerLocale();
  return { locale, t: translator(locale) };
}
