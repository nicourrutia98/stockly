/**
 * Stockly — typed RFC 7807 ProblemDetail error class.
 *
 * Mirrors the backend's `org.springframework.http.ProblemDetail` JSON
 * contract so that error rendering in the UI can rely on a stable shape.
 *
 * Three responsibilities:
 *  1. Carry the parsed ProblemDetail fields on a regular Error subclass.
 *  2. Carry the request URL (for logging + correlation-id breadcrumb).
 *  3. Carry the original response (Status, headers) so callers can decide
 *     whether to retry (e.g. on 401 the auth store needs to attempt a
 *     refresh).
 *
 * @see https://www.rfc-editor.org/rfc/rfc7807
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */

import { zProblemDetail, type ProblemDetail } from '@stockly/shared/types/error';

export class ApiError extends Error {
  /** Parsed RFC 7807 payload (validated against `zProblemDetail`). */
  readonly problem: ProblemDetail;
  /** HTTP status code (duplicated for ergonomic reads). */
  readonly status: number;
  /** URL that triggered the error. */
  readonly url: string;
  /** Optional correlation id surfaced by the backend. */
  readonly correlationId: string | undefined;
  /** Field-level validation errors (only set when 400 + Validation Failed). */
  readonly fieldErrors: Readonly<Record<string, readonly string[]>> | undefined;

  constructor(
    message: string,
    opts: {
      problem: ProblemDetail;
      status: number;
      url: string;
      correlationId?: string | undefined;
    },
  ) {
    super(message);
    this.name = 'ApiError';
    this.problem = opts.problem;
    this.status = opts.status;
    this.url = opts.url;
    this.correlationId = opts.correlationId;
    this.fieldErrors = opts.problem.fieldErrors;
  }

  /**
   * User-facing summary combining the canonical `title` and the optional
   * `detail`. Avoids leaking internal exception messages to the UI.
   */
  get userMessage(): string {
    if (this.problem.detail && this.problem.detail.length > 0) {
      return `${this.problem.title}: ${this.problem.detail}`;
    }
    return this.problem.title;
  }

  /**
   * Factory that parses a fetch response and converts it into an ApiError.
   * Falls back to a synthetic ProblemDetail when the body is not JSON.
   */
  static async fromResponse(
    response: Response,
    url: string,
  ): Promise<ApiError> {
    const problem = await parseProblemDetail(response);
    const correlationId = response.headers.get('x-correlation-id') ?? undefined;
    return new ApiError(problem.title, {
      problem,
      status: response.status,
      url,
      correlationId,
    });
  }
}

/**
 * Read the response body and validate it against `zProblemDetail`. If the
 * server returned HTML or an empty body (e.g. on a 502 from a proxy), we
 * synthesize a ProblemDetail so downstream code still gets a typed shape.
 */
async function parseProblemDetail(response: Response): Promise<ProblemDetail> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return {
      type: 'about:blank',
      title: response.statusText || 'Request failed',
      status: response.status,
    };
  }

  try {
    const raw: unknown = await response.json();
    const parsed = zProblemDetail.safeParse(raw);
    if (parsed.success) {
      return parsed.data;
    }
    // Server returned JSON but the shape isn't ProblemDetail.
    return {
      type: 'about:blank',
      title: response.statusText || 'Request failed',
      status: response.status,
    };
  } catch {
    return {
      type: 'about:blank',
      title: response.statusText || 'Request failed',
      status: response.status,
    };
  }
}