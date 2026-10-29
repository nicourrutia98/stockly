/**
 * Stockly — typed `fetch` wrapper for the Spring Boot REST API.
 *
 * Responsibilities:
 *   1. Resolve the absolute URL via `getApiBaseUrl()`.
 *   2. Attach `Authorization: Bearer <accessToken>` if present.
 *   3. Send cookies (so the HttpOnly refresh cookie is included).
 *   4. Validate the response status:
 *        2xx → parse JSON (or return `null` for 204)
 *        401 → trigger silent refresh (single in-flight promise), then retry once
 *        anything else → throw `ApiError`
 *   5. Apply an optional `init.timeoutMs` (default 15s).
 *
 * Why a hand-rolled wrapper instead of axios?
 *   - Smaller surface area (~250 LoC vs ~12 KB axios + its plugins).
 *   - Full control over the refresh flow (no axios interceptors wrestling).
 *   - Strict TS: every method is a single call site with explicit generics.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */

import { z, type ZodTypeAny } from 'zod';

import { ApiError } from './api-error';
import { buildApiUrl } from '../env';
import { useAuth } from '../../store/auth';

/**
 * Optional init flags layered on top of `RequestInit`. Kept separate
 * so callers can pass our extras without polluting the standard fields.
 */
export interface ApiFetchInit extends Omit<RequestInit, 'body'> {
  /** Schema applied to a successful response. Defaults to `z.unknown()`. */
  schema?: ZodTypeAny;
  /** Override the bearer access token (defaults to the one in the auth store). */
  accessToken?: string | null;
  /** Per-request timeout in milliseconds. Default 15 000. */
  timeoutMs?: number;
  /**
   * If `true`, do NOT include credentials (no cookies). Default `false`
   * (cookies are needed for the HttpOnly refresh flow).
   */
  skipCredentials?: boolean;
  /**
   * Pre-serialized JSON body. Strings / FormData / Blob are forwarded
   * to fetch unchanged.
   */
  jsonBody?: unknown;
}

/**
 * Lower-case method helpers — sugar around `apiFetch` so call sites
 * read like REST. Each one validates the response against an optional
 * Zod schema before returning.
 */
export const api = {
  get: <T>(path: string, init?: ApiFetchInit) =>
    apiFetch<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, init?: ApiFetchInit) =>
    apiFetch<T>(path, { ...init, method: 'POST' }),
  put: <T>(path: string, init?: ApiFetchInit) =>
    apiFetch<T>(path, { ...init, method: 'PUT' }),
  patch: <T>(path: string, init?: ApiFetchInit) =>
    apiFetch<T>(path, { ...init, method: 'PATCH' }),
  delete: <T>(path: string, init?: ApiFetchInit) =>
    apiFetch<T>(path, { ...init, method: 'DELETE' }),
};

/**
 * Auth endpoints must never trigger the 401 → refresh → retry path: a 401
 * from `/auth/refresh` is the refresh failing, not an expired access token.
 * Retrying it would post the same single-use cookie again and turn a
 * recoverable state into a blacklist/reuse signal.
 */
function isAuthEndpoint(path: string): boolean {
  return path.startsWith('/auth/');
}

/**
 * Performs a request to the Stockly REST API and returns the parsed
 * (and optionally schema-validated) JSON body.
 *
 * On 401, attempts a single silent refresh + retry. On any other
 * non-2xx status, throws `ApiError` containing the RFC 7807 problem
 * detail from the response.
 */
export async function apiFetch<T>(
  path: string,
  init: ApiFetchInit = {},
): Promise<T> {
  const {
    schema = z.unknown(),
    accessToken: accessTokenOverride,
    timeoutMs = 15_000,
    skipCredentials = false,
    jsonBody,
    headers: extraHeaders,
    ...rest
  } = init;

  const perform = async (
    overrideToken: string | null | undefined,
    retried = false,
  ): Promise<T> => {
    const url = buildApiUrl(path);
    const accessToken =
      overrideToken !== undefined ? overrideToken : useAuth.getState().accessToken;
    const headers = new Headers(extraHeaders);
    if (jsonBody !== undefined && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    if (!headers.has('accept')) {
      headers.set('accept', 'application/json');
    }
    if (accessToken !== null && accessToken !== undefined) {
      headers.set('authorization', `Bearer ${accessToken}`);
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    const fetchInit: RequestInit = {
      ...(rest as RequestInit),
      headers,
      signal: controller.signal,
      credentials: skipCredentials ? 'omit' : 'include',
      body: jsonBody !== undefined ? JSON.stringify(jsonBody) : (rest as { body?: BodyInit }).body,
    };

    try {
      const response = await fetch(url, fetchInit);
      clearTimeout(timeoutHandle);

      // 204 No Content → return undefined cast (caller can pass z.undefined()).
      if (response.status === 204) {
        return undefined as T;
      }

      if (response.ok) {
        // Some endpoints may return 200 with an empty body — handle gracefully.
        const text = await response.text();
        const json: unknown = text.length === 0 ? null : JSON.parse(text);
        const parsed = schema.safeParse(json);
        if (!parsed.success) {
          throw new ApiError(
            'API returned a payload that does not match the expected schema',
            {
              problem: {
                type: 'about:blank',
                title: 'Response Schema Mismatch',
                status: response.status,
                detail: parsed.error.issues
                  .slice(0, 3)
                  .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
                  .join('; '),
              },
              status: response.status,
              url,
            },
          );
        }
        return parsed.data as T;
      }

      // Non-2xx. 401 is special: try to refresh once (never for /auth/*).
      if (response.status === 401 && !retried && !isAuthEndpoint(path)) {
        // Share the single in-flight probe with AuthBootstrap/ProtectedRoute
        // so a page load can never issue two rotations of the same cookie.
        const { refreshSession } = await import('./auth-api');
        const refreshedOk = await refreshSession();
        const refreshed = refreshedOk ? useAuth.getState().accessToken : null;
        if (refreshed !== null) {
          return perform(refreshed, true);
        }
        // Refresh failed — fall through to throw the original 401.
      }

      throw await ApiError.fromResponse(response, url);
    } catch (error) {
      clearTimeout(timeoutHandle);
      if (error instanceof ApiError) {
        throw error;
      }
      // AbortError or network error → synthesize a 0-status ProblemDetail.
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timed out', {
          problem: {
            type: 'about:blank',
            title: 'Request Timeout',
            status: 408,
            detail: `The request to ${url} did not complete within ${timeoutMs}ms.`,
          },
          status: 408,
          url,
        });
      }
      throw new ApiError('Network error', {
        problem: {
          type: 'about:blank',
          title: 'Network Error',
          status: 0,
          detail: (error as Error)?.message ?? 'Unknown fetch failure',
        },
        status: 0,
        url,
      });
    }
  };

  return perform(accessTokenOverride);
}