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

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.stockly.auth.domain.Role;
import com.stockly.auth.domain.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;

/**
 * Stateless JWT issuance and validation.
 *
 * <p>This service is the single source of truth for token shape and signing.
 * Tokens are HS256-signed; the key is derived from {@link JwtProperties#secret()}
 * padded/truncated to exactly 32 bytes. Two flavours are produced:
 * <ul>
 *   <li><strong>Access</strong> &mdash; 15 min TTL, sent as the
 *       {@code Authorization: Bearer ...} header on every authenticated
 *       request. Lives only in client memory.</li>
 *   <li><strong>Refresh</strong> &mdash; 7 d TTL, delivered as an
 *       {@code HttpOnly} cookie. Used solely to mint a new access token
 *       via {@code POST /api/v1/auth/refresh}.</li>
 * </ul>
 *
 * <h2>Claims</h2>
 * <ul>
 *   <li>{@code sub} &mdash; the user id (string-form {@code Long}).</li>
 *   <li>{@code email} &mdash; convenience claim, used by
 *       {@code /api/v1/auth/me}.</li>
 *   <li>{@code role} &mdash; the user's {@link com.stockly.auth.domain.Role}.</li>
 *   <li>{@code typ} &mdash; {@code "access"} or {@code "refresh"}.</li>
 *   <li>{@code jti} &mdash; UUID; used as the key into the
 *       {@link TokenStoreService} blacklist.</li>
 * </ul>
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    /**
     * Token type stored in the {@code typ} claim.
     */
    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    private final JwtProperties properties;
    private final SecretKey signingKey;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        this.signingKey = buildKey(properties.secret());
        log.info("JwtService ready (issuer={}, access={}s, refresh={}s)",
                properties.issuer(),
                properties.accessTokenValidity(),
                properties.refreshTokenValidity());
    }

    // ---------------------------------------------------------------------
    //  Issuance
    // ---------------------------------------------------------------------

    /**
     * Mint a short-lived access token for the given user.
     */
    public IssuedToken issueAccessToken(User user) {
        return issue(user, TYPE_ACCESS, Duration.ofSeconds(properties.accessTokenValidity()));
    }

    /**
     * Mint a long-lived refresh token for the given user.
     */
    public IssuedToken issueRefreshToken(User user) {
        return issue(user, TYPE_REFRESH, Duration.ofSeconds(properties.refreshTokenValidity()));
    }

    private IssuedToken issue(User user, String type, Duration ttl) {
        Instant now = Instant.now();
        Instant exp = now.plus(ttl);
        String jti = UUID.randomUUID().toString();

        String raw = Jwts.builder()
                .subject(Long.toString(user.getId()))
                .issuer(properties.issuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .id(jti)
                .claims(Map.of(
                        "typ", type,
                        "email", user.getEmail(),
                        "role", user.getRole().name()
                ))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();

        return new IssuedToken(raw, jti, exp);
    }

    // ---------------------------------------------------------------------
    //  Validation / parsing
    // ---------------------------------------------------------------------

    /**
     * Parse and validate a JWT string. Returns empty when the token is
     * malformed, expired, or signed with a different key.
     *
     * @param token raw token (without the {@code Bearer } prefix)
     * @return the parsed claims or empty on any failure
     */
    public java.util.Optional<ParsedToken> parse(String token) {
        if (token == null || token.isBlank()) {
            return java.util.Optional.empty();
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .requireIssuer(properties.issuer())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return java.util.Optional.of(new ParsedToken(
                    claims.getId(),
                    Long.parseLong(claims.getSubject()),
                    claims.get("email", String.class),
                    Role.valueOf(claims.get("role", String.class)),
                    claims.get("typ", String.class),
                    claims.getExpiration().toInstant()
            ));
        } catch (ExpiredJwtException ex) {
            log.debug("JWT expired: {}", ex.getMessage());
            return java.util.Optional.empty();
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("JWT invalid: {}", ex.getMessage());
            return java.util.Optional.empty();
        }
    }

    // ---------------------------------------------------------------------
    //  Internals
    // ---------------------------------------------------------------------

    /**
     * Build a {@link SecretKey} from the configured secret, validating the
     * length requirement (HS256 needs >= 256 bits = 32 bytes).
     */
    private static SecretKey buildKey(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "jwt.secret must be set (env var JWT_SECRET in production)");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < JwtProperties.MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "jwt.secret must be at least " + JwtProperties.MIN_SECRET_BYTES
                            + " bytes (HS256 / 256 bits); actual " + bytes.length
                            + " bytes — set the JWT_SECRET env var to a longer value.");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    /**
     * Tuple returned to the caller from {@link #issueAccessToken(User)} and
     * {@link #issueRefreshToken(User)}: the compact JWT, its JTI and its
     * expiration instant.
     */
    public record IssuedToken(String value, String jti, Instant expiresAt) { }

    /**
     * Tuple returned to the caller from {@link #parse(String)}: the verified
     * claims projected onto a value object the rest of the security layer can
     * reason about without touching the jjwt API.
     */
    public record ParsedToken(
            String jti,
            Long userId,
            String email,
            Role role,
            String type,
            Instant expiresAt
    ) {
        public boolean isAccessToken() {
            return TYPE_ACCESS.equals(type);
        }

        public boolean isRefreshToken() {
            return TYPE_REFRESH.equals(type);
        }
    }
}