/**
 * Stockly — lista de cotización (M2, spec_id=20).
 *
 * Prompt Fogg sin checkout: el comprador arma su cotización (capacidad
 * máxima, 1 clic) y la copia para enviarla por el canal que prefiera.
 * Sin cuentas, sin fricción, sin datos inventados.
 *
 * Persistencia en localStorage: no es secreto (precios públicos), así que
 * a diferencia del token de auth aquí sí es correcto.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QuoteLine {
  id: number;
  name: string;
  sku: string;
  price: number;
  qty: number;
}

interface QuoteState {
  lines: QuoteLine[];
  add: (item: Omit<QuoteLine, 'qty'>, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}

export const useQuote = create<QuoteState>()(
  persist(
    (set) => ({
      lines: [],
      add: (item, qty = 1) =>
        set((s) => {
          const found = s.lines.find((l) => l.id === item.id);
          if (found) {
            return {
              lines: s.lines.map((l) =>
                l.id === item.id ? { ...l, qty: Math.min(999, l.qty + qty) } : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...item, qty }] };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          lines:
            qty <= 0
              ? s.lines.filter((l) => l.id !== id)
              : s.lines.map((l) => (l.id === id ? { ...l, qty: Math.min(999, qty) } : l)),
        })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'stockly-quote' },
  ),
);

export const quoteCount = (s: QuoteState): number =>
  s.lines.reduce((a, l) => a + l.qty, 0);

export const quoteTotal = (s: QuoteState): number =>
  s.lines.reduce((a, l) => a + l.qty * l.price, 0);

/** Resumen en texto plano para copiar/pegar por WhatsApp, correo, etc. */
export function quoteSummary(lines: QuoteLine[]): string {
  const rows = lines.map(
    (l) =>
      `• ${l.name} (${l.sku}) x${l.qty} — ${new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(l.price * l.qty)}`,
  );
  const total = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(lines.reduce((a, l) => a + l.qty * l.price, 0));
  return [`Cotización Stockly`, ...rows, `Total: ${total}`].join('\n');
}
