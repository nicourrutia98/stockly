/**
 * Stockly — application shell (header + content slot + footer).
 *
 * One chrome for every public surface, so the landing, catalog, detail
 * and quote pages cannot drift apart. It is a client component because
 * it reads the auth store, the quote store and the locale context; the
 * page content passed as `children` may still be a Server Component.
 *
 * Accessibility:
 *  - skip link is the first focusable element;
 *  - `<nav aria-label>` + `aria-current="page"` for the active route;
 *  - the quote badge has an explicit accessible name.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge, Group, UnstyledButton } from '@mantine/core';
import { IconLayoutDashboard, IconShoppingCart } from '@tabler/icons-react';

import { useI18n } from '../../i18n/I18nProvider';
import { logout } from '../../lib/api/auth-api';
import { selectIsAuthenticated, useAuth } from '../../store/auth';
import { quoteCount, useQuote } from '../../store/quote';
import { LocaleSwitcher } from './LocaleSwitcher';

const CONTENT_MAX_WIDTH = '68rem';

const linkBase: React.CSSProperties = {
  fontWeight: 500,
  color: 'var(--color-gray-700)',
  padding: '0.35rem 0.15rem',
  borderBottom: '2px solid transparent',
  lineHeight: 1.2,
};

function navLinkStyle(active: boolean): React.CSSProperties {
  return active
    ? { ...linkBase, color: 'var(--color-primary-600)', borderBottomColor: 'var(--color-primary-500)' }
    : linkBase;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { t } = useI18n();
  const authenticated = useAuth(selectIsAuthenticated);
  const cartCount = useQuote(quoteCount);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <a
        href="#contenido"
        className="stockly-skip-link"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          background: 'var(--color-primary-500)',
          color: '#fff',
          padding: '0.5rem 1rem',
          zIndex: 100,
        }}
      >
        {t('shell.skip')}
      </a>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'saturate(180%) blur(8px)',
          borderBottom: '1px solid var(--color-gray-200)',
        }}
      >
        <nav
          aria-label={t('shell.nav.label')}
          style={{
            maxWidth: CONTENT_MAX_WIDTH,
            margin: '0 auto',
            padding: '0.65rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            aria-label={t('shell.brand.home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              fontSize: '1.125rem',
              color: 'var(--color-gray-900)',
              marginRight: 'auto',
              textDecoration: 'none',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" width={28} height={28} aria-hidden="true" />
            Stockly
          </Link>

          <Group gap="md" wrap="wrap">
            <Link
              href="/"
              aria-current={isActive('/') ? 'page' : undefined}
              style={navLinkStyle(isActive('/'))}
            >
              {t('shell.nav.home')}
            </Link>
            <Link
              href="/catalogo"
              aria-current={isActive('/catalogo') ? 'page' : undefined}
              style={navLinkStyle(isActive('/catalogo'))}
            >
              {t('shell.nav.catalog')}
            </Link>
            <Link
              href="/about"
              aria-current={isActive('/about') ? 'page' : undefined}
              style={navLinkStyle(isActive('/about'))}
            >
              {t('shell.nav.about')}
            </Link>
            {authenticated ? (
              <Link
                href="/admin"
                aria-current={isActive('/admin') ? 'page' : undefined}
                style={{ ...navLinkStyle(isActive('/admin')), display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <IconLayoutDashboard size={16} aria-hidden="true" />
                {t('shell.nav.panel')}
              </Link>
            ) : null}
          </Group>

          <Group gap="sm" wrap="nowrap">
            <LocaleSwitcher />
            <Link
              href="/cotizacion"
              aria-label={t('shell.quote.count', { n: mounted ? cartCount : 0 })}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 999,
                color: 'var(--color-primary-600)',
                border: '1px solid var(--color-gray-200)',
                background: '#fff',
                textDecoration: 'none',
              }}
            >
              <IconShoppingCart size={18} aria-hidden="true" />
              {mounted && cartCount > 0 ? (
                <Badge
                  size="xs"
                  color="stockly-yellow"
                  variant="filled"
                  style={{ position: 'absolute', top: -6, right: -6, padding: '0 5px' }}
                >
                  {cartCount}
                </Badge>
              ) : null}
            </Link>

            {authenticated ? (
              <UnstyledButton
                type="button"
                onClick={() => {
                  void logout().then(() => router.replace('/login'));
                }}
                style={{
                  color: 'var(--color-gray-700)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid var(--color-gray-200)',
                  background: '#fff',
                }}
              >
                {t('shell.nav.logout')}
              </UnstyledButton>
            ) : (
              <UnstyledButton
                component={Link}
                href="/login"
                style={{
                  background: 'var(--color-primary-500)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '0.5rem 1.1rem',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                {t('shell.nav.login')}
              </UnstyledButton>
            )}
          </Group>
        </nav>
      </header>

      <div id="contenido">{children}</div>

      <footer
        style={{
          borderTop: '1px solid var(--color-gray-200)',
          background: '#FFFFFF',
          padding: '1.75rem 1.5rem 2.5rem',
          marginTop: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: CONTENT_MAX_WIDTH,
            margin: '0 auto',
            fontSize: '0.8125rem',
            color: 'var(--color-gray-500)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div>{t('shell.footer.copyright')}</div>
          <div>
            {t('shell.footer.license')} · v0.1.0 ·{' '}
            <Link href="/about" style={{ color: 'var(--color-primary-500)' }}>
              {t('shell.footer.about')}
            </Link>{' '}
            ·{' '}
            <Link href="/BRANDING.md" style={{ color: 'var(--color-primary-500)' }}>
              {t('shell.footer.branding')}
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
