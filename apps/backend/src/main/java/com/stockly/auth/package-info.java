/**
 * Authentication and authorisation bounded context.
 *
 * <p>Exposes the security stack to the rest of the application:
 * <ul>
 *   <li>{@code domain.User} (JPA entity) and {@code domain.Role} enum
 *       ({@code ROLE_USER}, {@code ROLE_ADMIN}).</li>
 *   <li>{@code security.SecurityConfig} — stateless filter chain,
 *       CSRF disabled, JWT-only authentication.</li>
 *   <li>{@code security.JwtService} — generate / parse / validate
 *       HS256 access (15 min) and refresh (7 d) tokens via jjwt 0.12.6.</li>
 *   <li>{@code security.TokenStoreService} — Redis-backed JTI blacklist
 *       used to invalidate refresh tokens on logout.</li>
 *   <li>{@code service.AuthService} — login, refresh, logout, current-user
 *       orchestration; integrates Spring Security authentication and the
 *       token store.</li>
 *   <li>{@code api.AuthController} — {@code POST /api/v1/auth/login},
 *       {@code POST /api/v1/auth/refresh}, {@code POST /api/v1/auth/logout},
 *       {@code GET /api/v1/auth/me}.</li>
 * </ul>
 *
 * <h2>Token delivery</h2>
 * <p>The access token travels in the {@code Authorization: Bearer ...} header
 * (15 min TTL, kept in memory by the client). The refresh token travels as an
 * {@code HttpOnly}, {@code SameSite=Lax}, {@code Secure}-in-{prod} cookie
 * (7 d TTL); the server never sees the raw token, only its hash on rotation.
 *
 * <h2>Why this package is separate from {@code product}</h2>
 * <p>Authentication is a cross-cutting concern. Even if today only one bounded
 * context (product inventory) sits behind the auth wall, future contexts
 * (analytics, reporting, admin) will reuse the same user database, roles and
 * token services without crossing the domain boundary.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
package com.stockly.auth;