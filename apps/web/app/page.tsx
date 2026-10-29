/**
 * Stockly — landing (Server Component).
 *
 * Chrome come from `<AppShell>`; this file owns only the content. Copy is
 * resolved through `getServerT()` so the first byte already matches the
 * locale cookie (no Spanish flash before hydration).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import Link from 'next/link';

import { AppShell } from '../src/components/layout/AppShell';
import { listCatalog } from '../src/lib/catalog-api';
import { getServerT } from '../src/i18n/server';
import type { MessageKey } from '../src/i18n/types';

const ACCESOS: ReadonlyArray<{
  href: string;
  title: MessageKey;
  detail: MessageKey;
}> = [
  { href: '/catalogo', title: 'landing.quick.catalog.title', detail: 'landing.quick.catalog.detail' },
  { href: '/login', title: 'landing.quick.login.title', detail: 'landing.quick.login.detail' },
  { href: '/about', title: 'landing.quick.about.title', detail: 'landing.quick.about.detail' },
];

/**
 * Prueba social honesta (SOTA escasez/prueba social 2025: nada inventado).
 * Cada cifra sale del catálogo real o de la licencia, no de testimonios
 * fabricados — en un proyecto académico la autoridad verificable es la
 * mejor señal.
 */
const TRUST: ReadonlyArray<{
  label: MessageKey;
  value: (stats: CatalogStats) => string;
}> = [
  { label: 'landing.trust.products', value: (s) => String(s.total) },
  { label: 'landing.trust.categories', value: (s) => String(s.categories) },
  { label: 'landing.trust.available', value: (s) => String(s.available) },
];

interface CatalogStats {
  total: number;
  categories: number;
  available: number;
}

const PALETTE: ReadonlyArray<{ token: string; hex: string; usage: MessageKey }> = [
  { token: 'primary-500', hex: '#0F4C81', usage: 'landing.palette.primary500' },
  { token: 'primary-400', hex: '#1E5AA8', usage: 'landing.palette.primary400' },
  { token: 'primary-600', hex: '#0A3B66', usage: 'landing.palette.primary600' },
  { token: 'accent-500', hex: '#F5B700', usage: 'landing.palette.accent500' },
  { token: 'gray-900', hex: '#0F172A', usage: 'landing.palette.gray900' },
  { token: 'gray-700', hex: '#334155', usage: 'landing.palette.gray700' },
];

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid var(--color-gray-200)',
  borderRadius: '12px',
  padding: '1.25rem',
};

export default async function HomePage() {
  const { t } = await getServerT();

  // Cifras reales del catálogo: si el backend no responde, la landing
  // degrada a "—" en vez de mentir con un número estático.
  const catalogStats = await listCatalog({ size: 100 })
    .then((page) => ({
      total: page.totalElements,
      categories: new Set(page.content.map((p) => p.category)).size,
      available: page.content.filter((p) => p.stock > 0).length,
    }))
    .catch(() => null);

  return (
    <AppShell>
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          padding: '3rem 1.5rem 2rem',
          background: 'var(--color-gray-50)',
        }}
      >
        <section aria-labelledby="hero-heading" style={{ textAlign: 'center', maxWidth: '44rem' }}>
          <h1 id="hero-heading" style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 1rem' }}>
            {t('landing.title')}
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--color-gray-700)', margin: '0 0 1.75rem' }}>
            {t('landing.lede')}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/login"
              style={{
                background: 'var(--color-primary-500)',
                color: '#FFFFFF',
                fontWeight: 600,
                padding: '0.75rem 1.75rem',
                borderRadius: '8px',
              }}
            >
              {t('landing.cta.panel')}
            </Link>
            <Link
              href="/catalogo"
              style={{
                border: '2px solid var(--color-primary-500)',
                color: 'var(--color-primary-500)',
                fontWeight: 600,
                padding: '0.75rem 1.75rem',
                borderRadius: '8px',
              }}
            >
              {t('landing.cta.catalog')}
            </Link>
          </div>
        </section>

        <nav
          aria-label={t('landing.quick.label')}
          style={{
            width: '100%',
            maxWidth: '52rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {ACCESOS.map((a) => (
            <Link key={a.href} href={a.href} style={{ ...card, color: 'inherit' }}>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{t(a.title)}</strong>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)' }}>{t(a.detail)}</span>
            </Link>
          ))}
        </nav>

        <section
          aria-labelledby="trust-heading"
          style={{ width: '100%', maxWidth: '52rem', borderTop: '1px solid var(--color-gray-200)', paddingTop: '1.5rem' }}
        >
          <h2 id="trust-heading" style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.75rem' }}>
            {t('landing.trust.title')}
          </h2>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            {TRUST.map((item) => (
              <li key={item.label}>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: 'var(--color-primary-500)' }}>
                  {catalogStats !== null ? item.value(catalogStats) : '—'}
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-gray-700)' }}>{t(item.label)}</span>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', marginTop: '1rem' }}>
            {t('landing.trust.footnote')}
          </p>
        </section>

        <section aria-labelledby="palette-heading" style={{ ...card, width: '100%', maxWidth: '52rem' }}>
          <h2 id="palette-heading" style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem' }}>
            {t('landing.palette.title')}
          </h2>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {PALETTE.map((swatch) => (
              <li
                key={swatch.token}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  border: '1px solid var(--color-gray-200)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--color-gray-50)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: swatch.hex,
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                      fontSize: '0.8125rem',
                      color: 'var(--color-gray-900)',
                      fontWeight: 500,
                    }}
                  >
                    {swatch.token} · {swatch.hex}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                    {t(swatch.usage)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </AppShell>
  );
}
