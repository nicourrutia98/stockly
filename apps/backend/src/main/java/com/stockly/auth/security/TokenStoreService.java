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

import java.time.Duration;
import java.time.Instant;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Redis-backed token revocation list.
 *
 * <p>Stores JWT IDs ({@code jti}) of revoked tokens until they would have
 * expired anyway. This is a single-purpose abstraction over Redis: it owns
 * the key naming scheme and the TTL semantics, so callers don't have to
 * reach for {@link StringRedisTemplate} directly.
 *
 * <h2>Key scheme</h2>
 * <ul>
 *   <li>{@code stockly:jwt:blacklist:&lt;jti&gt;} &rarr; {@code "1"}. TTL =
 *       remaining time-to-live of the revoked token, so Redis evicts entries
 *       automatically when they are no longer relevant.</li>
 * </ul>
 *
 * <h2>Why a blacklist instead of a whitelist?</h2>
 * <p>A whitelist (only allow tokens whose jti is in Redis) would force every
 * request to hit Redis, doubling the latency cost of authentication. A
 * blacklist only requires a Redis hit on logout/refresh &mdash; the steady
 * state is no extra Redis traffic.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
@Service
public class TokenStoreService {

    private static final Logger log = LoggerFactory.getLogger(TokenStoreService.class);

    /**
     * Redis key prefix for blacklisted JTIs.
     */
    static final String BLACKLIST_KEY_PREFIX = "stockly:jwt:blacklist:";

    /**
     * Redis key prefix for JTIs rotated inside the grace window.
     *
     * <p>Rotation is single-use, but the response carrying the new cookie can
     * be lost (a reload or navigation aborts the request after the server has
     * already rotated). Remembering the rotated JTI for a few seconds lets a
     * retry inside that window get a fresh pair instead of a false "revoked"
     * that would force a re-login.
     */
    static final String ROTATED_KEY_PREFIX = "stockly:jwt:rotated:";

    /** How long a rotated JTI may be replayed to recover a lost Set-Cookie. */
    private static final Duration ROTATION_GRACE = Duration.ofSeconds(20);

    private final StringRedisTemplate redis;

    public TokenStoreService(StringRedisTemplate redis) {
        this.redis = redis;
        log.info("TokenStoreService wired (Redis key prefix={})", BLACKLIST_KEY_PREFIX);
    }

    /**
     * Add a JTI to the blacklist until the token's natural expiry.
     *
     * @param jti          the JWT id to revoke
     * @param expiresAt    the original token expiration
     */
    public void blacklist(String jti, Instant expiresAt) {
        if (jti == null || jti.isBlank()) {
            return;
        }
        Duration ttl = Duration.between(Instant.now(), expiresAt);
        if (ttl.isNegative() || ttl.isZero()) {
            // Already expired; nothing to remember.
            return;
        }
        redis.opsForValue().set(BLACKLIST_KEY_PREFIX + jti, "1", ttl);
        log.debug("Blacklisted jti {} for {} s", jti, ttl.getSeconds());
    }

    /**
     * Check whether a JTI is currently blacklisted.
     *
     * @return true if the JTI was found in Redis
     */
    public boolean isBlacklisted(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }
        Boolean exists = redis.hasKey(BLACKLIST_KEY_PREFIX + jti);
        return Boolean.TRUE.equals(exists);
    }

    /**
     * Read-only convenience to fetch every currently-blacklisted JTI. Intended
     * for diagnostic endpoints, never for the request hot path.
     */
    public Set<String> snapshotBlacklistKeys() {
        return redis.keys(BLACKLIST_KEY_PREFIX + "*");
    }

    /**
     * Remember that a JTI was rotated just now (short TTL).
     *
     * @param jti the old JWT id, already blacklisted
     */
    public void markRotated(String jti) {
        if (jti == null || jti.isBlank()) {
            return;
        }
        redis.opsForValue().set(ROTATED_KEY_PREFIX + jti, "1", ROTATION_GRACE);
    }

    /**
     * Whether the JTI was rotated inside the grace window. Used to tolerate a
     * refresh retry when the response carrying the new cookie never arrived.
     */
    public boolean isRecentlyRotated(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }
        Boolean exists = redis.hasKey(ROTATED_KEY_PREFIX + jti);
        return Boolean.TRUE.equals(exists);
    }
}