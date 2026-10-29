/**
 * Domain primitives of the auth module: the {@link com.stockly.auth.domain.User}
 * aggregate and its associated {@link com.stockly.auth.domain.Role} enum.
 *
 * <p>This package is intentionally lightweight: no Spring annotations leak
 * in (no {@code @Service}, no {@code @Repository}); persistence is handled by
 * repositories in {@code com.stockly.auth.persistence} and the security wiring
 * lives in {@code com.stockly.auth.security}. Domain stays pure so that the
 * authentication invariants can be reasoned about without bringing up the
 * Spring context.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
package com.stockly.auth.domain;