/**
 * Stockly — i18n runtime (dictionaries + interpolation).
 *
 * Deliberately dependency-free: a flat record + a `{name}` interpolator.
 * next-intl would add routing/middleware weight we do not need for two
 * locales and no localized routes.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import { en } from './messages/en';
import { esCO } from './messages/es-CO';
import type { Locale, MessageKey, MessageVars, TFunction } from './types';

export * from './types';

const dictionaries: Record<Locale, Record<MessageKey, string>> = {
  'es-CO': esCO,
  en,
};

export { esCO, en, dictionaries };

/**
 * Looks up `key` in `locale` and replaces `{token}` placeholders.
 * Missing vars are left as-is (visible during QA, harmless in production).
 */
export function translate(locale: Locale, key: MessageKey, vars?: MessageVars): string {
  const template = dictionaries[locale]?.[key] ?? dictionaries['es-CO'][key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, token: string) =>
    token in vars ? String(vars[token]) : match,
  );
}

/** Curried translator for a fixed locale (used by Server Components). */
export function translator(locale: Locale): TFunction {
  return (key, vars) => translate(locale, key, vars);
}
