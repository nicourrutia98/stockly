/**
 * Stockly — página de cotización (M2, spec_id=20).
 *
 * El cierre del loop Fogg: lo armado con 1 clic se vuelve un resumen
 * copiable. Sin checkout falso, sin formulario que nadie pidió.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';

import { AppShell } from '../../src/components/layout/AppShell';
import { useT } from '../../src/i18n/I18nProvider';
import { formatCOP } from '../../src/lib/catalog-api';
import { quoteSummary, quoteTotal, useQuote } from '../../src/store/quote';

export default function CotizacionPage() {
  const t = useT();
  const lines = useQuote((s) => s.lines);
  const setQty = useQuote((s) => s.setQty);
  const remove = useQuote((s) => s.remove);
  const clear = useQuote((s) => s.clear);
  const total = useQuote(quoteTotal);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(quoteSummary(lines));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <AppShell>
    <main style={{ maxWidth: '44rem', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      <p>
        <Link href="/catalogo">{t('quote.back')}</Link>
      </p>
      <h1>{t('quote.title')}</h1>

      {lines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('quote.empty.title')}</p>
          <p style={{ color: 'var(--color-gray-700)' }}>
            {t('quote.empty.body')}
          </p>
          <Link
            href="/catalogo"
            style={{
              display: 'inline-block',
              marginTop: '1rem',
              background: 'var(--color-primary-500)',
              color: '#fff',
              fontWeight: 600,
              padding: '0.75rem 1.75rem',
              borderRadius: '10px',
            }}
          >
            {t('quote.empty.cta')}
          </Link>
        </div>
      ) : (
        <>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
            {lines.map((l) => (
              <li
                key={l.id}
                style={{ background: '#fff', border: '1px solid var(--color-gray-200)', borderRadius: '12px', padding: '1rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline' }}>
                  <div>
                    <strong>{l.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>SKU {l.sku}</div>
                  </div>
                  <strong>{formatCOP(l.price * l.qty)}</strong>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
                  <button type="button" aria-label={t('quote.removeOne', { name: l.name })} onClick={() => setQty(l.id, l.qty - 1)}>
                    −
                  </button>
                  <span aria-live="polite">x{l.qty}</span>
                  <button type="button" aria-label={t('quote.addOne', { name: l.name })} onClick={() => setQty(l.id, l.qty + 1)}>
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(l.id)}
                    style={{ marginLeft: 'auto', background: 'none', border: 0, color: 'var(--color-gray-500)' }}
                  >
                    {t('quote.remove')}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <p style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'right' }}>
            {t('quote.total', { amount: formatCOP(total) })}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => void copy()}
              style={{
                background: 'var(--color-primary-500)',
                color: '#fff',
                border: 0,
                borderRadius: '10px',
                padding: '0.75rem 1.5rem',
                fontWeight: 600,
              }}
            >
              {copied ? t('quote.copied') : t('quote.copy')}
            </button>
            <button
              type="button"
              onClick={() => clear()}
              style={{ background: 'none', border: '1px solid var(--color-gray-200)', borderRadius: '10px', padding: '0.75rem 1.5rem' }}
            >
              {t('quote.clear')}
            </button>
          </div>
          <p style={{ color: 'var(--color-gray-700)', fontSize: '0.9rem' }}>
            {t('quote.hint')}
          </p>
        </>
      )}
    </main>
    </AppShell>
  );
}
