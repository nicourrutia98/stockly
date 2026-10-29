/**
 * Stockly — API pública del catálogo (M1, spec_id=20).
 *
 * Lee el storefront sin autenticación: el backend expone
 * GET /products/** como público (solo-lectura). Sin Bearer, sin cookies,
 * sin reintento de refresh — esto NO es el cliente autenticado
 * (`lib/api/client.ts`).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import {
  zProduct,
  zProductPage,
  type Product,
  type ProductPage,
} from '@stockly/shared/types/product';

const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_INTERNAL_URL ??
  'http://localhost:8080/api/v1';

export interface CatalogQuery {
  q?: string;
  category?: string;
  page?: number;
  size?: number;
}

/** El formateador canonico vive en `format-money` y se reexporta aqui para no
 *  romper los imports existentes del modulo de catalogo. Una sola definicion:
 *  duplicarla es como el admin y el catalogo empezaron a pintar importes
 *  distintos. */
export { formatCOP, formatCOP as formatMoney } from './format-money';

export async function listCatalog(q: CatalogQuery = {}): Promise<ProductPage> {
  const sp = new URLSearchParams();
  sp.set('page', String(q.page ?? 0));
  sp.set('size', String(Math.min(q.size ?? 12, 100)));
  // El catalogo publico solo puede mostrar productos activos (RN-10: la baja es
  // logica, un producto dado de baja no debe seguir a la venta). Sin este filtro
  // el total y las paginas 2+ exponen productos desactivados; la pagina 1 solo
  // se ve bien por el orden de insercion, lo que oculta el defecto.
  sp.set('active', 'true');
  if (q.q) sp.set('search', q.q);
  if (q.category) sp.set('category', q.category);
  const res = await fetch(`${BASE}/products?${sp.toString()}`, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Catálogo no disponible (${res.status})`);
  return zProductPage.parse(await res.json());
}

export async function getCatalogProduct(id: number): Promise<Product | null> {
  const res = await fetch(`${BASE}/products/${id}`, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Producto no disponible (${res.status})`);
  return zProduct.parse(await res.json());
}

/**
 * Categorías derivadas del catálogo real, nunca hardcodeadas: una lista
 * fija envejece en cuanto el inventario cambia y el filtro deja de ofrecer
 * categorías que sí existen (y ofrece vacías).
 *
 * Límite conocido: lee hasta 100 productos (tope del endpoint). Si el
 * catálogo superara ese tamaño habría que exponer un facet endpoint en el
 * backend; hoy el volumen del MVP no lo justifica.
 */
export async function listCategories(): Promise<ReadonlyArray<string>> {
  const res = await fetch(`${BASE}/products?page=0&size=100`, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const page = zProductPage.parse(await res.json());
  return [...new Set(page.content.map((p) => p.category))].sort((a, b) =>
    a.localeCompare(b, 'es-CO'),
  );
}
