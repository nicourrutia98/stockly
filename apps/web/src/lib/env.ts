/**
 * Stockly — base URL resolution for the Spring Boot REST API.
 *
 * The browser-exposed variable (`NEXT_PUBLIC_API_URL`) is the canonical
 * source of truth. It already includes the `/api/v1` prefix, so consumers
 * can `apiFetch("/products")` and get `http://localhost:8080/api/v1/products`.
 *
 * On the server side we fall back to the same value (read from `process.env`
 * directly because `NEXT_PUBLIC_*` is also available there) so that any
 * Server Components / Route Handlers run during SSR work identically.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */

const DEFAULT_API_URL = 'http://localhost:8080/api/v1';

/**
 * Returns the absolute base URL for the Stockly REST API.
 *
 * Reads `NEXT_PUBLIC_API_URL` from `process.env` on the server, or
 * `import.meta.env` on the client (Next.js injects `NEXT_PUBLIC_*`
 * variables into both). If unset, returns the dev default.
 *
 * The trailing `/api/v1` segment is mandatory: the Spring controllers
 * are mounted at `@RequestMapping("/api/v1/...")`.
 */
export function getApiBaseUrl(): string {
  const fromServer = process.env['NEXT_PUBLIC_API_URL'];
  if (typeof fromServer === 'string' && fromServer.length > 0) {
    return stripTrailingSlash(fromServer);
  }

  const fromClient =
    typeof globalThis !== 'undefined' &&
    // @ts-expect-error — import.meta is populated by Next.js at build time
    typeof globalThis.importMeta !== 'undefined'
      ? // @ts-expect-error — see above
        globalThis.importMeta.env?.['NEXT_PUBLIC_API_URL']
      : undefined;
  if (typeof fromClient === 'string' && fromClient.length > 0) {
    return stripTrailingSlash(fromClient);
  }

  return DEFAULT_API_URL;
}

/**
 * Normalizes a path against the API base. Accepts paths starting with
 * `/` (e.g. `"/products"`) or the API prefix (e.g. `"/api/v1/products"`).
 * Returns the full URL (`http://localhost:8080/api/v1/products`).
 *
 * @param path  Relative path (e.g. `/auth/login`) or absolute URL.
 */
export function buildApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}