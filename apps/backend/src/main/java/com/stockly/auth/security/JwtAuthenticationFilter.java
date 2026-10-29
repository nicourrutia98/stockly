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

import java.io.IOException;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.stockly.auth.persistence.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Stateless authentication filter.
 *
 * <p>Reads the {@code Authorization} header on every request. If a valid JWT
 * is present and not on the blacklist, the filter:
 * <ol>
 *   <li>Loads the user from {@link UserRepository} (cached by id internally).</li>
 *   <li>Populates the {@link SecurityContextHolder} with a
 *       {@link UsernamePasswordAuthenticationToken} whose principal is the
 *       user and whose authorities come from their {@link com.stockly.auth.domain.Role}.</li>
 * </ol>
 *
 * <p>If the header is absent, malformed, expired, or the user is missing /
 * inactive, the filter does not throw &mdash; it just leaves the security
 * context empty so the downstream chain returns 401 / 403 via the standard
 * Spring Security entry point. This is intentional: a missing token is not an
 * exceptional condition, it's a normal anonymous request.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    /** Conventional header name; matches {@code Authorization} on every browser. */
    public static final String HEADER = "Authorization";

    /** Prefix mandated by RFC 6750 §2.1. */
    public static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final TokenStoreService tokenStore;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository,
            TokenStoreService tokenStore
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.tokenStore = tokenStore;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain
    ) throws ServletException, IOException {

        String header = request.getHeader(HEADER);
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            // Anonymous request — let downstream decide.
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(BEARER_PREFIX.length()).trim();

        Optional<JwtService.ParsedToken> parsed = jwtService.parse(token);
        if (parsed.isEmpty()) {
            log.debug("Rejected request {} {}: invalid token", request.getMethod(), request.getRequestURI());
            chain.doFilter(request, response);
            return;
        }

        JwtService.ParsedToken claims = parsed.get();

        if (!claims.isAccessToken()) {
            log.debug("Rejected request {} {}: refresh token used as access", request.getMethod(), request.getRequestURI());
            chain.doFilter(request, response);
            return;
        }

        if (tokenStore.isBlacklisted(claims.jti())) {
            log.debug("Rejected request {} {}: blacklisted jti", request.getMethod(), request.getRequestURI());
            chain.doFilter(request, response);
            return;
        }

        try {
            var userDetails = userRepository.findById(claims.userId())
                    .orElseThrow(() -> new UsernameNotFoundException(
                            "User not found for id " + claims.userId()));

            if (!userDetails.isEnabled()) {
                log.debug("Rejected request: disabled user {}", userDetails.getUsername());
                chain.doFilter(request, response);
                return;
            }

            var auth = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
            );
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);

            log.trace("Authenticated user {} for {}", userDetails.getUsername(), request.getRequestURI());
        } catch (UsernameNotFoundException ex) {
            log.debug("Token referenced missing user: {}", claims.userId());
        }

        chain.doFilter(request, response);
    }
}