/**
 * Service layer for the product bounded context.
 *
 * <p>Where business orchestration lives. The service is the only layer that
 * may:
 * <ul>
 *   <li>open transactions ({@link org.springframework.transaction.annotation.Transactional}
 *       with default {@code readOnly = true} on the class, write methods override);</li>
 *   <li>throw domain exceptions ({@link ProductNotFoundException},
 *       {@link ProductSkuConflictException});</li>
 *   <li>enforce cross-aggregate rules (SKU uniqueness, soft-delete
 *       semantics);</li>
 *   <li>compose {@link org.springframework.data.jpa.domain.Specification}
 *       chains from {@link com.stockly.product.persistence.ProductSpecifications}.</li>
 * </ul>
 *
 * <p>Layering rules (enforced by convention, not by tooling):
 * <ol>
 *   <li><b>Service &rarr; Repository only:</b> the service never queries the
 *   entity manager directly. Spring Data repos are the boundary.</li>
 *   <li><b>Controller &rarr; Service only:</b> the controller never reaches
 *   into the repository. Avoids leaking JPA into the API layer.</li>
 *   <li><b>No HTTP types in the service:</b> no {@code HttpStatus},
 *       {@code ResponseEntity}, or {@code ProblemDetail}. The service throws
 *       domain exceptions; the {@code api.error.GlobalExceptionHandler}
 *       translates them.</li>
 * </ol>
 *
 * <h2>Why pure functions where possible</h2>
 * <p>{@link ProductSearchCriteria#isRangeValid()} and
 * {@link ProductSearchCriteria#hasAnyFilter()} are deterministic and free of
 * Spring dependencies &mdash; they can be unit-tested without the Spring
 * context. The rest of the class lives inside the bean and uses injected
 * repositories and mappers.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
package com.stockly.product.service;