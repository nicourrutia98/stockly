/**
 * Stockly — i18n type surface (no runtime dictionaries).
 *
 * Kept dependency-free so both the client provider and the server helper
 * can import it without pulling every message file into the bundle.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import type { esCO } from './messages/es-CO';

/** Locales supported by the app. es-CO is canonical. */
export const LOCALES = ['es-CO', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es-CO';

/** Cookie name read by Server Components (so SSR matches the client). */
export const LOCALE_COOKIE = 'stockly_locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Flat, dot-namespaced key derived from the Spanish dictionary. */
export type MessageKey = keyof typeof esCO;

export type MessageVars = Record<string, string | number>;

export type TFunction = (key: MessageKey, vars?: MessageVars) => string;
