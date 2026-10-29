/**
 * Shared kernel: cross-cutting concerns.
 *
 * <p>Conventions:
 * <ul>
 *   <li>Exceptions that map to RFC 7807 ProblemDetail responses live here
 *       (T4 will add {@code ResourceNotFoundException}, {@code ValidationException},
 *       {@code BusinessRuleException}).</li>
 *   <li>Global exception handlers ({@code @RestControllerAdvice}) live here.</li>
 *   <li>Cross-cutting utilities (correlation IDs, currency formatters, page DTOs)
 *       live here.</li>
 *   <li>Anything in this package MUST NOT depend on {@code product} or {@code auth}.</li>
 * </ul>
 *
 * <p>See dark-memory spec_id=6 · T4 for the full contract.
 *
 * @since 0.1.0
 */
package com.stockly.shared;