/**
 * Stockly — detalle editorial de producto (M1, spec_id=20).
 *
 * Layout 2 columnas: cover a la izquierda, datos a la derecha.
 * Sin frases de marketing vacías; información accionable.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AppShell } from '../../../src/components/layout/AppShell';
import { ProductCover } from '../../../src/components/ProductCover';
import { QuoteButton } from '../../../src/components/QuoteButton';
import { formatCOP, getCatalogProduct } from '../../../src/lib/catalog-api';
import { getServerT } from '../../../src/i18n/server';

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getCatalogProduct(Number(id)).catch(() => null);
  if (!product) notFound();
  const { t } = await getServerT();

  return (
    <AppShell>
    <main className="container">
      <p className="back">
        <Link href="/catalogo">← {t('catalog.title')}</Link>
      </p>

      <article className="layout">
        <div className="cover">
          <ProductCover category={product.category} code={product.sku.slice(0, 4)} size={520} title={product.name} />
        </div>

        <div className="info">
          <p className="cat">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="price">{formatCOP(product.price)}</p>

          <dl className="specs">
            <div>
              <dt>{t('catalog.detail.sku')}</dt>
              <dd><code>{product.sku}</code></dd>
            </div>
            <div>
              <dt>{t('catalog.detail.availability')}</dt>
              <dd>
                {product.stock > 0 ? (
                  <strong style={{ color: product.stock <= 3 ? '#B45309' : '#15803D' }}>
                    {product.stock <= 3
                      ? t('catalog.availability.low', { n: product.stock })
                      : t('catalog.detail.stockCount', { n: product.stock })}
                  </strong>
                ) : (
                  <strong style={{ color: '#B91C1C' }}>{t('catalog.availability.out')}</strong>
                )}
              </dd>
            </div>
            <div>
              <dt>{t('catalog.detail.category')}</dt>
              <dd>{product.category}</dd>
            </div>
          </dl>

          {product.description && (
            <section className="desc">
              <h2>{t('catalog.detail.description')}</h2>
              <p>{product.description}</p>
            </section>
          )}

          <div className="quote-box">
            <QuoteButton
              id={product.id}
              name={product.name}
              sku={product.sku}
              price={product.price}
              disabled={product.stock <= 0}
            />
          </div>

          <div className="cta">
            <Link href="/login" className="btn-primary">
              {t('catalog.detail.manage')}
            </Link>
            <Link href="/catalogo" className="btn-ghost">
              {t('catalog.detail.back')}
            </Link>
          </div>
        </div>
      </article>

      <style>{`
        .container { max-width: 72rem; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
        .back { margin: 0 0 1.5rem; }
        .back a { color: var(--color-primary-500); text-decoration: none; font-size: 0.9rem; }
        .layout {
          display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 3rem; align-items: start;
        }
        @media (max-width: 720px) { .layout { grid-template-columns: 1fr; gap: 1.5rem; } }
        .cover { background: #fff; border: 1px solid var(--color-gray-200); border-radius: 16px; padding: 1rem; }
        .info h1 { font-size: 2rem; font-weight: 700; margin: 0.5rem 0; letter-spacing: -0.01em; }
        .info .cat { margin: 0; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-gray-500); }
        .price { font-size: 1.75rem; font-weight: 700; margin: 0.5rem 0 1.5rem; }
        .specs { display: grid; grid-template-columns: max-content 1fr; column-gap: 1.5rem; row-gap: 0.6rem; margin: 0 0 1.5rem; padding: 1rem 1.25rem; background: #fff; border: 1px solid var(--color-gray-200); border-radius: 12px; }
        .specs dt { color: var(--color-gray-500); font-size: 0.85rem; }
        .specs dd { margin: 0; color: var(--color-gray-900); font-weight: 500; }
        .specs code { font-family: var(--font-jetbrains-mono), ui-monospace, monospace; font-size: 0.85rem; }
        .desc { margin: 1.5rem 0; }
        .desc h2 { font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem; }
        .desc p { margin: 0; color: var(--color-gray-700); line-height: 1.6; }
        .quote-box { max-width: 22rem; }
        .cta { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.5rem; }
        .btn-primary { background: var(--color-primary-500); color: #fff; font-weight: 600; padding: 0.85rem 1.6rem; border-radius: 10px; text-decoration: none; }
        .btn-primary:hover { background: var(--color-primary-600); }
        .btn-ghost { border: 1px solid var(--color-gray-200); color: var(--color-gray-900); font-weight: 500; padding: 0.85rem 1.6rem; border-radius: 10px; text-decoration: none; }
        .btn-ghost:hover { background: var(--color-gray-50); }
      `}</style>
    </main>
    </AppShell>
  );
}
