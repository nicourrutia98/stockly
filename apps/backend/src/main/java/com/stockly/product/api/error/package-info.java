/**
 * Cross-cutting API-layer concerns: error handling and response shaping.
 *
 * <p>Houses the global {@code @RestControllerAdvice} that translates domain
 * and framework exceptions into RFC 7807 {@link org.springframework.http.ProblemDetail}
 * responses. The advice is intentionally scoped to the
 * {@code com.stockly.product.api} package &mdash; future bounded contexts
 * (auth, in T6+) ship their own advice with their own exception vocabulary.
 *
 * <h2>Why one advice per bounded context</h2>
 * <ul>
 *   <li>Keeps the response shape stable per context: clients of
 *   {@code /api/v1/products} never see an {@code auth.*} error and
 *   vice-versa.</li>
 *   <li>Lets each context own its message keys (e.g.
 *   {@code product.not.found} lives in the product advice's
 *   {@code messages_*.properties} namespace).</li>
 *   <li>Avoids the "god advice" that imports every exception type in the
 *   app.</li>
 * </ul>
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
package com.stockly.product.api.error;