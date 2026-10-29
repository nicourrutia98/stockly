/**
 * Stockly — catálogo público (M1, spec_id=20).
 *
 * Estilo: editorial, no AI-slop. Tarjetas con cover SVG determinista por
 * categoría, jerarquía tipográfica limpia, microinteracciones reales
 * (hover lift, focus ring). Sin "Lorem", sin emojis, sin gradientes
 * genéricos.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import Link from 'next/link';

import { AppShell } from '../../src/components/layout/AppShell';
import { ProductCover } from '../../src/components/ProductCover';
import { QuoteButton } from '../../src/components/QuoteButton';
import { formatCOP, listCatalog, listCategories } from '../../src/lib/catalog-api';
import { getServerT } from '../../src/i18n/server';
import type { TFunction } from '../../src/i18n/types';

function availability(
  stock: number,
  t: TFunction,
): { text: string; fg: string; tone: 'good' | 'warn' | 'gone' } {
  if (stock <= 0) return { text: t('catalog.availability.out'), fg: '#B91C1C', tone: 'gone' };
  if (stock <= 3) return { text: t('catalog.availability.low', { n: stock }), fg: '#B45309', tone: 'warn' };
  return { text: t('catalog.availability.inStock'), fg: '#15803D', tone: 'good' };
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(0, Number(sp.page ?? 0) || 0);
  const { t } = await getServerT();
  const data = await listCatalog({
    q: sp.q,
    category: sp.categoria,
    page,
    size: 12,
  }).catch(() => null);
  const categories = await listCategories().catch(() => [] as ReadonlyArray<string>);

  return (
    <AppShell>
    <main className="container">
      <p className="back">
        <Link href="/">{t('catalog.back')}</Link>
      </p>

      <header className="header">
        <h1>{t('catalog.title')}</h1>
        <p className="lede">{t('catalog.lede')}</p>
      </header>

      <form method="get" role="search" aria-label={t('catalog.search.label')} className="filters">
        <label className="grow">
          <span className="sr">{t('catalog.search.label')}</span>
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder={t('catalog.search.placeholder')}
            maxLength={100}
          />
        </label>
        <label>
          <span className="sr">{t('catalog.category.label')}</span>
          <select name="categoria" defaultValue={sp.categoria ?? ''}>
            <option value="">{t('catalog.category.all')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">{t('catalog.search.submit')}</button>
      </form>

      {data === null ? (
        <p className="empty">{t('catalog.error')}</p>
      ) : data.content.length === 0 ? (
        <p className="empty">{t('catalog.empty')}</p>
      ) : (
        <>
          <p className="count" aria-live="polite">
            {t(data.totalElements === 1 ? 'catalog.count.one' : 'catalog.count.other', {
              n: data.totalElements,
            })}
            {sp.q ? t('catalog.count.filtered', { q: sp.q }) : ''}
          </p>

          <ul className="grid">
            {data.content.map((p) => {
              const a = availability(p.stock, t);
              return (
                <li key={p.id} className="card">
                  <Link href={`/catalogo/${p.id}`} className="card-link" aria-disabled={p.stock <= 0}>
                    <div className="cover">
                      <ProductCover category={p.category} code={p.sku.slice(0, 4)} title={p.name} />
                      {a.tone === 'gone' && <span className="ribbon">Agotado</span>}
                    </div>
                    <div className="body">
                      <span className="cat">{p.category}</span>
                      <h2 className="name">{p.name}</h2>
                      <p className="sku">SKU {p.sku}</p>
                      <div className="footer">
                        <span className="price">{formatCOP(p.price)}</span>
                        <span className="stock" style={{ color: a.fg }}>
                          {a.text}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="actions">
                    <QuoteButton
                      id={p.id}
                      name={p.name}
                      sku={p.sku}
                      price={p.price}
                      disabled={p.stock <= 0}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <nav className="pager" aria-label="Paginación">
            {page > 0 ? (
              <Link
                href={`/catalogo?${new URLSearchParams({
                  ...(sp.q ? { q: sp.q } : {}),
                  ...(sp.categoria ? { categoria: sp.categoria } : {}),
                  page: String(page - 1),
                }).toString()}`}
                className="pager-link"
              >
                {t('catalog.pager.prev')}
              </Link>
            ) : (
              <span className="pager-link disabled">{t('catalog.pager.prev')}</span>
            )}
            <span className="pager-status">
              {t('catalog.pager.status', { page: page + 1, total: Math.max(1, data.totalPages) })}
            </span>
            {!data.last && page + 1 < data.totalPages ? (
              <Link
                href={`/catalogo?${new URLSearchParams({
                  ...(sp.q ? { q: sp.q } : {}),
                  ...(sp.categoria ? { categoria: sp.categoria } : {}),
                  page: String(page + 1),
                }).toString()}`}
                className="pager-link"
              >
                {t('catalog.pager.next')}
              </Link>
            ) : (
              <span className="pager-link disabled">{t('catalog.pager.next')}</span>
            )}
          </nav>
        </>
      )}

      <style>{`
        .container { max-width: 72rem; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
        .back { margin: 0 0 1.5rem; }
        .back a { color: var(--color-primary-500); text-decoration: none; font-size: 0.9rem; }
        .header { margin-bottom: 1.75rem; }
        .header h1 { font-size: 2.25rem; font-weight: 700; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
        .lede { color: var(--color-gray-700); margin: 0; max-width: 42rem; }

        .filters { display: flex; gap: 0.6rem; flex-wrap: wrap; margin: 0 0 1.5rem; }
        .filters .grow { flex: 1 1 280px; }
        .filters input, .filters select {
          width: 100%; padding: 0.7rem 0.9rem; font-size: 0.95rem;
          border: 1px solid var(--color-gray-200); border-radius: 10px;
          background: #fff; color: var(--color-gray-900);
        }
        .filters input:focus, .filters select:focus { outline: none; border-color: var(--color-primary-500); box-shadow: 0 0 0 3px rgba(15,76,129,0.15); }
        .filters button {
          background: var(--color-primary-500); color: #fff; border: 0; border-radius: 10px;
          padding: 0.7rem 1.4rem; font-weight: 600; font-size: 0.95rem;
        }
        .filters button:hover { background: var(--color-primary-600); }
        .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

        .count { color: var(--color-gray-700); margin: 0 0 1rem; font-size: 0.95rem; }
        .empty { padding: 3rem 0; text-align: center; color: var(--color-gray-700); }

        .grid {
          list-style: none; margin: 0; padding: 0;
          display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem;
        }
        .card { background: #fff; border: 1px solid var(--color-gray-200); border-radius: 14px; overflow: hidden; transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 10px 24px -16px rgba(15,23,42,0.18); }
        .card-link { color: inherit; text-decoration: none; display: block; }
        .card-link:focus-visible { outline: 3px solid var(--color-primary-400); outline-offset: 2px; border-radius: 14px; }
        .card-link[aria-disabled="true"] { opacity: 0.6; pointer-events: none; }

        .cover { position: relative; }
        .ribbon { position: absolute; top: 12px; left: 12px; background: #0F172A; color: #fff; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: 999px; }

        .body { padding: 1rem 1.1rem 1.1rem; }
        .cat { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-gray-500); }
        .name { font-size: 1.05rem; font-weight: 600; margin: 0.4rem 0 0.25rem; line-height: 1.3; color: var(--color-gray-900); }
        .sku { margin: 0 0 0.75rem; font-family: var(--font-jetbrains-mono), ui-monospace, monospace; font-size: 0.78rem; color: var(--color-gray-500); }
        .footer { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
        .price { font-size: 1.2rem; font-weight: 700; color: var(--color-gray-900); }
        .stock { font-size: 0.82rem; font-weight: 600; }
        .actions { padding: 0 1.1rem 1.1rem; }

        .pager { display: flex; align-items: center; gap: 1rem; margin-top: 2.5rem; }
        .pager-link { color: var(--color-primary-500); text-decoration: none; font-weight: 500; }
        .pager-link.disabled { color: var(--color-gray-500); opacity: 0.5; }
        .pager-status { color: var(--color-gray-700); font-size: 0.9rem; }
      `}</style>
    </main>
    </AppShell>
  );
}
