/**
 * Stockly · About / Licencia
 *
 * Página visible donde se declara explícitamente la autoría, la institución
 * académica, la materia para la que se desarrolló el proyecto, y la licencia
 * MIT bajo la que se distribuye el código.
 *
 * Ruta: /about
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { AppShell } from '../../src/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Acerca de · Licencia',
  description:
    'Autoría y licencia de Stockly. Proyecto académico de la Universidad Surcolombiana de Neiva, distribuido bajo la Licencia MIT.',
};

const palette = {
  primary500: '#0F4C81',
  primary400: '#1E5AA8',
  primary600: '#0A3B66',
  accent: '#F5B700',
  gray900: '#0F172A',
  gray700: '#334155',
  gray500: '#64748B',
  gray200: '#E2E8F0',
  gray100: '#F1F5F9',
  gray50: '#F8FAFC',
};

const styles: Readonly<Record<string, React.CSSProperties>> = {
  main: {
    minHeight: 'auto',
    padding: '3rem 1.5rem 5rem',
    background: palette.gray50,
    color: palette.gray900,
  },
  container: {
    maxWidth: '48rem',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  eyebrow: {
    fontSize: '0.75rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: palette.primary500,
    fontWeight: 600,
    margin: 0,
  },
  h1: {
    fontSize: '2.25rem',
    fontWeight: 700,
    color: palette.gray900,
    margin: 0,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: palette.gray900,
    margin: '0 0 0.75rem',
  },
  card: {
    background: '#FFFFFF',
    border: `1px solid ${palette.gray200}`,
    borderRadius: '12px',
    padding: '1.5rem 1.75rem',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  },
  cardAccent: {
    background: '#FFFFFF',
    border: `1px solid ${palette.gray200}`,
    borderLeft: `4px solid ${palette.accent}`,
    borderRadius: '12px',
    padding: '1.5rem 1.75rem',
  },
  p: {
    margin: '0 0 0.75rem',
    color: palette.gray700,
    lineHeight: 1.6,
  },
  ul: {
    margin: '0.5rem 0 0',
    paddingLeft: '1.25rem',
    color: palette.gray700,
    lineHeight: 1.7,
  },
  dl: {
    display: 'grid',
    gridTemplateColumns: 'minmax(9rem, auto) 1fr',
    gap: '0.75rem 1.25rem',
    margin: 0,
  },
  dt: {
    fontWeight: 600,
    color: palette.gray900,
    fontSize: '0.9375rem',
  },
  dd: {
    margin: 0,
    color: palette.gray700,
    fontSize: '0.9375rem',
  },
  badge: {
    display: 'inline-block',
    fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
    fontSize: '0.75rem',
    padding: '0.25rem 0.625rem',
    borderRadius: '6px',
    background: palette.gray100,
    color: palette.gray900,
    border: `1px solid ${palette.gray200}`,
  },
  badgeAccent: {
    display: 'inline-block',
    fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
    fontSize: '0.75rem',
    padding: '0.25rem 0.625rem',
    borderRadius: '6px',
    background: '#FFFBEB',
    color: '#92400E',
    border: '1px solid #FCD34D',
    fontWeight: 600,
  },
  badgeMono: {
    display: 'inline-block',
    fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
    fontSize: '0.8125rem',
    padding: '0.3rem 0.75rem',
    borderRadius: '6px',
    background: palette.primary500,
    color: '#FFFFFF',
    border: 'none',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  authorRow: {
    display: 'inline-flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
    verticalAlign: 'middle',
  },
  footer: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: `1px solid ${palette.gray200}`,
    fontSize: '0.8125rem',
    color: palette.gray500,
    textAlign: 'center',
  },
};

export default function AboutPage() {
  return (
    <AppShell>
    <main style={styles.main}>
      <div style={styles.container}>
        {/* Hero */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={styles.eyebrow}>Acerca de · Licencia · Atribución</p>
          <h1 style={styles.h1}>Stockly</h1>
          <p style={{ ...styles.p, fontSize: '1.0625rem', margin: 0 }}>
            Plataforma fullstack para gestión de inventario de productos,
            construida como proyecto académico con stack de producción real.
          </p>
        </header>

        {/* Identidad académica */}
        <section aria-labelledby="academic-identity" style={styles.card}>
          <h2 id="academic-identity" style={styles.h2}>
            Identidad académica
          </h2>
          <dl style={styles.dl}>
            <dt style={styles.dt}>Autores</dt>
            <dd style={styles.dd}>
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                <li>
                  <span style={styles.authorRow}>
                    <strong>Juan Nicolas Urrutia Salcedo</strong>
                    <span style={styles.badgeMono}>u20182173626</span>
                  </span>
                </li>
                <li>
                  <span style={styles.authorRow}>
                    <strong>Luisa Maria Jose Coronel Vargas</strong>
                    <span style={styles.badgeMono}>u20222208436</span>
                  </span>
                </li>
                <li>
                  <span style={styles.authorRow}>
                    <strong>Ana Sofía Montaña Cedeño</strong>
                    <span style={styles.badgeMono}>u20212200775</span>
                  </span>
                </li>
              </ul>
            </dd>

            <dt style={styles.dt}>Institución</dt>
            <dd style={styles.dd}>
              <strong>Universidad Surcolombiana de Neiva</strong> (USCO)
              <br />
              Neiva — Huila, Colombia
              <br />
              <a
                href="https://www.usco.edu.co"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: palette.primary500, textDecoration: 'underline' }}
              >
                www.usco.edu.co
              </a>
            </dd>

            <dt style={styles.dt}>Materia</dt>
            <dd style={styles.dd}>
              <span style={styles.badgeAccent}>Inteligencia Artificial</span>
            </dd>

            <dt style={styles.dt}>Año</dt>
            <dd style={styles.dd}>2026</dd>

            <dt style={styles.dt}>Versión</dt>
            <dd style={styles.dd}>
              <span style={styles.badge}>v0.1.0</span>
            </dd>

            <dt style={styles.dt}>Spec activa</dt>
            <dd style={styles.dd}>
              <span style={styles.badge}>spec_id=6</span> (dark-memory)
            </dd>
          </dl>
        </section>

        {/* Licencia MIT */}
        <section aria-labelledby="license" style={styles.cardAccent}>
          <h2 id="license" style={styles.h2}>
            Licencia · MIT
          </h2>
          <p style={styles.p}>
            El código fuente de Stockly se distribuye bajo la{' '}
            <strong>Licencia MIT</strong> (Massachusetts Institute of Technology
            License), una licencia de software libre permisiva que permite el
            uso, copia, modificación, fusión, publicación, distribución,
            sublicenciamiento y venta del software, sujeto a la conservación
            del aviso de copyright y de los textos de permiso y limitación de
            responsabilidad.
          </p>
          <p style={{ ...styles.p, marginBottom: 0 }}>
            El texto íntegro de la licencia se encuentra en el archivo{' '}
            <Link href="/LICENSE" style={{ color: palette.primary500, textDecoration: 'underline' }}>
              <code>LICENSE</code>
            </Link>{' '}
            en la raíz del repositorio.
          </p>
          <p style={{ ...styles.p, marginTop: '0.75rem', marginBottom: 0 }}>
            <span style={styles.badge}>MIT License</span>{' '}
            <span style={styles.badge}>
              Copyright (c) 2026 Juan Nicolas Urrutia Salcedo, Luisa Maria Jose
              Coronel Vargas, Ana Sofía Montaña Cedeño
            </span>
          </p>
        </section>

        {/* Stack */}
        <section aria-labelledby="stack" style={styles.card}>
          <h2 id="stack" style={styles.h2}>
            Stack técnico
          </h2>
          <ul style={styles.ul}>
            <li>
              <strong>Frontend:</strong> Next.js 15 (App Router) + React 19 +
              TypeScript estricto + Mantine v7 + React Hook Form + Zod +
              TanStack Query + Zustand.
            </li>
            <li>
              <strong>Backend:</strong> Spring Boot 3.4.1 + Java 17 + JPA +
              PostgreSQL 16 + Redis 7 + Liquibase + MapStruct.
            </li>
            <li>
              <strong>Calidad:</strong> JaCoCo (≥80% line coverage), PIT
              (≥60% mutation score), Testcontainers, RFC 7807
              <code>ProblemDetail</code>, i18n (es-CO + en).
            </li>
            <li>
              <strong>Gobernanza:</strong> dark-memory MCP — cada cambio es
              auditable vía <code>spec_id=6</code>.
            </li>
          </ul>
        </section>

        <footer style={styles.footer}>
          <p style={{ margin: '0 0 0.25rem' }}>
            © 2026 Juan Nicolas Urrutia Salcedo, Luisa Maria Jose Coronel Vargas,
            Ana Sofía Montaña Cedeño
          </p>
          <p style={{ margin: '0 0 0.5rem' }}>
            Códigos u20182173626 · u20222208436 · u20212200775
          </p>
          <p style={{ margin: '0 0 0.5rem' }}>
            Universidad Surcolombiana de Neiva · Materia Inteligencia Artificial
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/" style={{ color: palette.primary500 }}>
              ← Volver al inicio
            </Link>
          </p>
        </footer>
      </div>
    </main>
    </AppShell>
  );
}