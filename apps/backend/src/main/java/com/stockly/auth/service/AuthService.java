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
package com.stockly.auth.service;

import java.time.Instant;
import java.util.Locale;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stockly.auth.api.dto.AuthResponse;
import com.stockly.auth.api.dto.LoginRequest;
import com.stockly.auth.api.dto.RegisterRequest;
import com.stockly.auth.api.dto.UserResponse;
import com.stockly.auth.domain.Role;
import com.stockly.auth.domain.User;
import com.stockly.auth.persistence.UserRepository;
import com.stockly.auth.security.JwtService;
import com.stockly.auth.security.TokenStoreService;

/**
 * Orchestrates the authentication flows.
 *
 * <h2>Use cases</h2>
 * <ul>
 *   <li>{@link #login(LoginRequest)} &mdash; verify credentials, mint
 *       access + refresh tokens, schedule the refresh cookie.</li>
 *   <li>{@link #refresh(String)} &mdash; swap a refresh token for a new
 *       access + refresh pair; the old refresh is blacklisted to enforce
 *       single-use rotation.</li>
 *   <li>{@link #logout(String)} &mdash; blacklist the supplied JTI so any
 *       subsequent request carrying it is rejected.</li>
 *   <li>{@link #currentUser(Long)} &mdash; look up the principal from the
 *       security context for {@code GET /api/v1/auth/me}.</li>
 * </ul>
 *
 * <p>All methods are read-only at the database boundary; token writes go to
 * Redis via {@link TokenStoreService}.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final TokenStoreService tokenStore;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            JwtService jwtService,
            TokenStoreService tokenStore,
            PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.tokenStore = tokenStore;
        this.passwordEncoder = passwordEncoder;
    }

    // ---------------------------------------------------------------------
    //  register
    // ---------------------------------------------------------------------

    /**
     * Create a {@code ROLE_USER} account.
     *
     * <p>The email is trimmed and lower-cased before the uniqueness check so
     * {@code Admin@X} and {@code admin@x} cannot both exist. Passwords are
     * bcrypt-encoded here; the plaintext never reaches the persistence layer.
     *
     * @param request validated registration payload
     * @return the public representation of the created user
     * @throws EmailAlreadyRegisteredException when the email is already taken
     */
    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException(email);
        }
        User user = new User(email, passwordEncoder.encode(request.password()), Role.ROLE_USER);
        User saved = userRepository.save(user);
        log.info("Registered user id={} role={}", saved.getId(), saved.getRole());
        return UserResponse.from(saved);
    }

    // ---------------------------------------------------------------------
    //  login
    // ---------------------------------------------------------------------

    /**
     * Authenticate by email + password. Throws
     * {@link BadCredentialsException} on wrong password and
     * {@link DisabledException} on a deactivated account.
     */
    @Transactional(readOnly = true)
    public Authenticated login(LoginRequest request) {
        log.debug("login attempt for {}", request.email());
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = (User) auth.getPrincipal();
        if (!user.isEnabled()) {
            throw new DisabledException("Account is disabled");
        }
        return mintBoth(user);
    }

    // ---------------------------------------------------------------------
    //  refresh
    // ---------------------------------------------------------------------

    /**
     * Exchange a refresh token (presented as a JTI — the cookie carries a
     * signed JTI, not the raw token, so the server never stores a plaintext
     * credential) for a new access + refresh pair. The old JTI is
     * blacklisted to enforce single-use rotation.
     */
    @Transactional(readOnly = true)
    public Authenticated refresh(String presentedJti, String presentedToken) {
        Optional<JwtService.ParsedToken> parsed = jwtService.parse(presentedToken);
        if (parsed.isEmpty() || !parsed.get().isRefreshToken()) {
            log.debug("Refresh failed: invalid token shape");
            throw new BadCredentialsException("Invalid refresh token");
        }
        JwtService.ParsedToken claims = parsed.get();

        if (!claims.jti().equals(presentedJti)) {
            log.warn("Refresh failed: JTI mismatch (cookie tampering?)");
            throw new BadCredentialsException("Refresh token mismatch");
        }

        User user = userRepository.findById(claims.userId())
                .orElseThrow(() -> new BadCredentialsException("User no longer exists"));

        if (!user.isEnabled()) {
            throw new DisabledException("Account is disabled");
        }

        if (tokenStore.isBlacklisted(claims.jti())) {
            // The previous rotation may have completed server-side while the
            // response (and its Set-Cookie) was lost to a reload. Inside the
            // grace window reissue a pair instead of forcing a re-login.
            if (tokenStore.isRecentlyRotated(claims.jti())) {
                log.info("Refresh replay inside grace window for jti {} — reissuing pair", claims.jti());
                return mintBoth(user);
            }
            log.debug("Refresh failed: blacklisted jti {}", claims.jti());
            throw new BadCredentialsException("Refresh token has been revoked");
        }

        // Single-use: blacklist the old refresh before issuing the new pair.
        tokenStore.blacklist(claims.jti(), claims.expiresAt());
        tokenStore.markRotated(claims.jti());

        return mintBoth(user);
    }

    // ---------------------------------------------------------------------
    //  logout
    // ---------------------------------------------------------------------

    /**
     * Blacklist the supplied refresh-token JTI. Access tokens issued alongside
     * it will continue to work until they expire naturally (max 15 min);
     * after that the user must present a valid (un-rotated) refresh.
     *
     * <p>If the JTI cannot be parsed we treat logout as a no-op &mdash; the
     * request is still answered 204 so the client can clear local state.
     */
    @Transactional(readOnly = true)
    public void logout(String presentedToken) {
        if (presentedToken == null || presentedToken.isBlank()) {
            return;
        }
        Optional<JwtService.ParsedToken> parsed = jwtService.parse(presentedToken);
        if (parsed.isEmpty()) {
            return;
        }
        JwtService.ParsedToken claims = parsed.get();
        tokenStore.blacklist(claims.jti(), claims.expiresAt());
        log.info("Logged out user {}", claims.userId());
    }

    // ---------------------------------------------------------------------
    //  current user
    // ---------------------------------------------------------------------

    /**
     * Resolve the currently authenticated user for {@code /auth/me}.
     */
    @Transactional(readOnly = true)
    public Optional<UserResponse> currentUser(Long id) {
        return userRepository.findById(id).map(UserResponse::from);
    }

    // ---------------------------------------------------------------------
    //  Internals
    // ---------------------------------------------------------------------

    private Authenticated mintBoth(User user) {
        JwtService.IssuedToken access = jwtService.issueAccessToken(user);
        JwtService.IssuedToken refresh = jwtService.issueRefreshToken(user);

        AuthResponse body = AuthResponse.of(
                access.value(),
                access.expiresAt(),
                UserResponse.from(user)
        );

        log.info("Issued session: user={} accessJti={} refreshJti={}",
                user.getEmail(), access.jti(), refresh.jti());

        return new Authenticated(body, refresh);
    }

    /**
     * Tuple returned from {@link #login(LoginRequest)} and
     * {@link #refresh(String, String)}: the response body plus the
     * refresh token that the controller will turn into an HttpOnly cookie.
     */
    public record Authenticated(AuthResponse body, JwtService.IssuedToken refresh) { }

    /**
     * Convenience: current epoch second (truncated). Exposed so the controller
     * can log it consistently with {@link Instant#now()} elsewhere.
     */
    public static Instant nowEpoch() {
        return Instant.now();
    }
}