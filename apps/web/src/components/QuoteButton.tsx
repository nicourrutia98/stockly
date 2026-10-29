/**
 * Stockly — islas cliente del cotizador (M2).
 *
 * QuoteButton: se incrusta en tarjetas y detalle (server) sin romper
 * el HTML (nunca un <button> dentro del <a> de la tarjeta).
 * QuoteCount: contador vivo para el nav.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import Link from 'next/link';

import { quoteCount, useQuote } from '../store/quote';
import { formatCOP } from '../lib/catalog-api';

interface ButtonProps {
  id: number;
  name: string;
  sku: string;
  price: number;
  disabled?: boolean;
}

export function QuoteButton({ id, name, sku, price, disabled }: ButtonProps) {
  const add = useQuote((s) => s.add);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => add({ id, name, sku, price })}
      aria-label={`Agregar ${name} a la cotización`}
      style={{
        width: '100%',
        marginTop: '0.75rem',
        background: disabled ? 'var(--color-gray-200)' : 'var(--color-primary-500)',
        color: disabled ? 'var(--color-gray-500)' : '#fff',
        border: 0,
        borderRadius: '10px',
        padding: '0.65rem',
        fontWeight: 600,
        fontSize: '0.9rem',
      }}
    >
      {disabled ? 'Agotado' : `Cotizar · ${formatCOP(price)}`}
    </button>
  );
}

export function QuoteCount() {
  const count = useQuote(quoteCount);
  if (count === 0) return null;
  return (
    <Link
      href="/cotizacion"
      aria-label={`Ver cotización con ${count} productos`}
      style={{
        background: 'var(--color-accent-500)',
        color: '#0F172A',
        fontWeight: 700,
        padding: '0.5rem 1rem',
        borderRadius: '999px',
        fontSize: '0.9rem',
      }}
    >
      Cotización ({count})
    </Link>
  );
}
