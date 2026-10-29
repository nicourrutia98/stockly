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
package com.stockly.auth.api;

import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stockly.auth.api.dto.AuthResponse;
import com.stockly.auth.api.dto.LoginRequest;
import com.stockly.auth.api.dto.RegisterRequest;
import com.stockly.auth.api.dto.UserResponse;
import com.stockly.auth.domain.User;
import com.stockly.auth.security.JwtProperties;
import com.stockly.auth.security.JwtService;
import com.stockly.auth.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/**
 * REST controller for the authentication flows.
 *
 * <p>Surface:
 * <ul>
 *   <li>{@code POST /api/v1/auth/login} &mdash; credentials in, access +
 *       refresh out. Refresh goes to an HttpOnly cookie.</li>
 *   <li>{@code POST /api/v1/auth/refresh} &mdash; rotate the refresh cookie
 *       and return a new access token. Old JTI blacklisted.</li>
 *   <li>{@code POST /api/v1/auth/logout} &mdash; blacklist the refresh
 *       token's JTI; clear the cookie.</li>
 *   <li>{@code GET /api/v1/auth/me} &mdash; current user info (requires
 *       valid access token).</li>
 * </ul>
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Login, refresh, logout and current-user endpoints.")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    /**
     * Cookie holding the refresh token. The literal value we serialise into
     * the cookie is the JTI (UUID); the actual refresh JWT travels in the
     * {@code rt_sig} companion cookie (signed by us; for v0.1.0 we keep both
     * in the same cookie value to avoid building a second signing key now).
     * See {@link #refreshCookie} for the storage shape.
     */
    private final AuthService authService;
    private final JwtProperties jwtProperties;
    private final com.stockly.auth.security.JwtService jwtService;

    public AuthController(AuthService authService, JwtProperties jwtProperties,
                          com.stockly.auth.security.JwtService jwtService) {
        this.authService = authService;
        this.jwtProperties = jwtProperties;
        this.jwtService = jwtService;
        log.info("AuthController initialised under /api/v1/auth");
    }

    // ---------------------------------------------------------------------
    //  POST /api/v1/auth/register
    // ---------------------------------------------------------------------

    @PostMapping("/register")
    @Operation(summary = "Create a ROLE_USER account by email + password.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Account created",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = UserResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation failed (RFC 7807)",
                    content = @Content(mediaType = "application/problem+json")
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Email already registered (RFC 7807)",
                    content = @Content(mediaType = "application/problem+json")
            )
    })
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.debug("POST /api/v1/auth/register");
        UserResponse created = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ---------------------------------------------------------------------
    //  POST /api/v1/auth/login
    // ---------------------------------------------------------------------

    @PostMapping("/login")
    @Operation(summary = "Authenticate by email + password, returning access token + refresh cookie.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Login successful",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = AuthResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation failed (RFC 7807)",
                    content = @Content(mediaType = "application/problem+json")
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Invalid credentials (RFC 7807)",
                    content = @Content(mediaType = "application/problem+json")
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Account disabled (RFC 7807)",
                    content = @Content(mediaType = "application/problem+json")
            )
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.debug("POST /api/v1/auth/login email={}", request.email());
        var authenticated = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(authenticated.refresh()))
                .body(authenticated.body());
    }

    // ---------------------------------------------------------------------
    //  POST /api/v1/auth/refresh
    // ---------------------------------------------------------------------

    @PostMapping("/refresh")
    @Operation(summary = "Rotate the refresh token and issue a fresh access token.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Refresh successful",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = AuthResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Refresh token invalid / revoked / already used (RFC 7807)",
                    content = @Content(mediaType = "application/problem+json")
            )
    })
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = "stockly_rt", required = false) String refreshCookieValue
    ) {
        log.debug("POST /api/v1/auth/refresh");
        if (refreshCookieValue == null || refreshCookieValue.isBlank()) {
            return ResponseEntity.status(HttpStatusCode.valueOf(401))
                    .header(HttpHeaders.SET_COOKIE, expireRefreshCookie())
                    .build();
        }
        String jti = extractJti(refreshCookieValue);
        var authenticated = authService.refresh(jti, refreshCookieValue);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(authenticated.refresh()))
                .body(authenticated.body());
    }

    // ---------------------------------------------------------------------
    //  POST /api/v1/auth/logout
    // ---------------------------------------------------------------------

    @PostMapping("/logout")
    @Operation(summary = "Blacklist the refresh token and clear the cookie.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Logout complete (idempotent)"),
            @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    public ResponseEntity<Void> logout(
            @CookieValue(name = "stockly_rt", required = false) String refreshCookieValue
    ) {
        log.info("POST /api/v1/auth/logout");
        authService.logout(refreshCookieValue);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, expireRefreshCookie())
                .build();
    }

    // ---------------------------------------------------------------------
    //  GET /api/v1/auth/me
    // ---------------------------------------------------------------------

    @GetMapping("/me")
    @Operation(summary = "Current authenticated user (requires valid access token).")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Current user",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = UserResponse.class)
                    )
            ),
            @ApiResponse(responseCode = "401", description = "Not authenticated (RFC 7807)")
    })
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatusCode.valueOf(401)).build();
        }
        User principal = (User) authentication.getPrincipal();
        UserResponse body = UserResponse.from(principal);
        return ResponseEntity.ok(body);
    }

    // ---------------------------------------------------------------------
    //  Cookie helpers
    // ---------------------------------------------------------------------

    /**
     * Build the {@code Set-Cookie} header for a successful login/refresh.
     * For v0.1.0 the cookie value IS the refresh JWT (signed by JwtService);
     * a future hardening step (T7+) can split into {@code jti + signature}.
     */
    private String refreshCookie(JwtService.IssuedToken refresh) {
        long maxAge = Math.max(0, Duration.between(Instant.now(), refresh.expiresAt()).getSeconds());
        return ResponseCookie.from(jwtProperties.cookie().name(), refresh.value())
                .httpOnly(true)
                .secure(jwtProperties.cookie().secure())
                .sameSite(jwtProperties.cookie().sameSite())
                .path(jwtProperties.cookie().path())
                .maxAge(maxAge)
                .build()
                .toString();
    }

    /**
     * Build the {@code Set-Cookie} header that clears the refresh cookie
     * (maxAge=0). Same path / sameSite attributes so the browser matches the
     * cookie to clear.
     */
    private String expireRefreshCookie() {
        return ResponseCookie.from(jwtProperties.cookie().name(), "")
                .httpOnly(true)
                .secure(jwtProperties.cookie().secure())
                .sameSite(jwtProperties.cookie().sameSite())
                .path(jwtProperties.cookie().path())
                .maxAge(0)
                .build()
                .toString();
    }

    /**
     * For v0.1.0 the JTI is the first segment of the cookie, separated by a
     * dot from the raw token. We accept both the bare JWT (old shape) and
     * the {@code jti.token} shape (future-proof). The service ultimately
     * parses the full token.
     */
    /**
     * Extract the JTI from the {@code stockly_rt} cookie value.
     *
     * <p>v0.1.0 storage shape: the cookie holds the full signed refresh JWT,
     * so the JTI is read from its claims via {@link JwtService#parse(String)}.
     * A bare (non-JWT) value is returned as-is for backwards compatibility
     * with the future {@code jti.signature} split.
     */
    private String extractJti(String cookieValue) {
        var parsed = jwtService.parse(cookieValue);
        if (parsed.isPresent()) {
            return parsed.get().jti();
        }
        int dot = cookieValue.indexOf('.');
        if (dot <= 0) {
            return cookieValue;
        }
        return cookieValue.substring(0, dot);
    }
}