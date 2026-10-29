/**
 * Security infrastructure of the auth module: JWT primitives, request
 * filters, the Spring Security filter chain configuration, and the Redis
 * token blacklist.
 *
 * <p>This package depends on {@code org.springframework.security} and
 * {@code io.jsonwebtoken} (jjwt 0.12.6). The two together provide a stateless
 * authentication pipeline:
 *
 * <ol>
 *   <li>{@link com.stockly.auth.security.JwtAuthenticationFilter} reads the
 *       {@code Authorization} header on every request, validates the token
 *       via {@link com.stockly.auth.security.JwtService}, and populates the
 *       {@link org.springframework.security.core.context.SecurityContextHolder}
 *       with the resulting {@link org.springframework.security.core.userdetails.UserDetails}.</li>
 *   <li>{@link com.stockly.auth.security.SecurityConfig} wires the filter
 *       into the chain, defines which routes are public
 *       ({@code /api/v1/auth/**}, {@code /actuator/health}, {@code /swagger-ui/**},
 *       {@code /v3/api-docs/**}) and configures the password encoder.</li>
 *   <li>{@link com.stockly.auth.security.TokenStoreService} wraps Redis
 *       operations used to blacklist refresh-token JTIs on logout.</li>
 * </ol>
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
package com.stockly.auth.security;