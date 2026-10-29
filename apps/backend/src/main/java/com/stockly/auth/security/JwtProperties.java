/*
 * MIT License
 *
 * Copyright (c) 2026 Juan Nicolas Urrutia Salcedo
 * Student ID: u20182173626
 * Universidad Surcolombiana de Neiva — Materia: Inteligencia Artificial
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
package com.stockly.auth.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Type-safe binding for the {@code jwt.*} property namespace.
 *
 * <p>Values are populated by Spring Boot at startup from
 * {@code application.yml} and (in production) overridden via environment
 * variables. Validation lives in {@link JwtService} where the values are
 * consumed, so that a misconfigured deployment fails fast with a clear
 * error rather than with a cryptic JWT parse failure mid-request.
 *
 * @param secret                HMAC SHA-256 secret. Must be at least
 *                              {@value #MIN_SECRET_BYTES} bytes long (256 bits).
 * @param accessTokenValidity   access token lifetime in seconds (default 900 = 15 min)
 * @param refreshTokenValidity  refresh token lifetime in seconds (default 604800 = 7 d)
 * @param issuer                the {@code iss} claim stamped on every token
 * @param cookie                the refresh-token cookie configuration
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        String secret,
        long accessTokenValidity,
        long refreshTokenValidity,
        String issuer,
        Cookie cookie
) {

    /**
     * Minimum secret length, in bytes (256 bits = 32 bytes). HS256 will throw
     * at signing time if the key is shorter, but we surface it as a clearer
     * error during startup.
     */
    public static final int MIN_SECRET_BYTES = 32;

    /**
     * Default access token validity (15 minutes) &mdash; aligned with the
     * product spec ("JWT access 15min en memoria").
     */
    public static final long DEFAULT_ACCESS_VALIDITY = 900L;

    /**
     * Default refresh token validity (7 days).
     */
    public static final long DEFAULT_REFRESH_VALIDITY = 604_800L;

    /**
     * Default issuer claim.
     */
    public static final String DEFAULT_ISSUER = "stockly-backend";

    /**
     * Default cookie name for the refresh token.
     */
    public static final String DEFAULT_COOKIE_NAME = "stockly_rt";

    /**
     * Nested refresh-token cookie settings.
     *
     * @param name        the cookie attribute name (default {@code stockly_rt})
     * @param secure      whether to set the {@code Secure} attribute (true in prod)
     * @param sameSite    the {@code SameSite} attribute value (Lax is the most
     *                    secure default that still allows the auth flow across
     *                    same-site redirects)
     * @param httpOnly    whether to set the {@code HttpOnly} attribute (always
     *                    true; the value here is for documentation only)
     * @param path        the cookie path scope; {@code /} means it is sent on
     *                    every request to the backend
     */
    public record Cookie(
            String name,
            boolean secure,
            String sameSite,
            boolean httpOnly,
            String path
    ) {
        public Cookie {
            if (name == null || name.isBlank()) {
                name = DEFAULT_COOKIE_NAME;
            }
            if (sameSite == null || sameSite.isBlank()) {
                sameSite = "Lax";
            }
            if (path == null || path.isBlank()) {
                path = "/";
            }
        }
    }
}