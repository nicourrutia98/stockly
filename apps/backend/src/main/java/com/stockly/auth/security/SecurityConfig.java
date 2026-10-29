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

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.stockly.config.WebMvcConfig;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security wiring for the stateless JWT pipeline.
 *
 * <h2>Decisions</h2>
 * <ul>
 *   <li><strong>CSRF disabled</strong> &mdash; safe because the API is stateless
 *       and uses bearer tokens (no automatic browser cookie to defend).</li>
 *   <li><strong>Session creation policy = STATELESS</strong> &mdash; no
 *       {@code HttpSession} is ever created; every request carries its own
 *       authentication state in the JWT.</li>
 *   <li><strong>CORS</strong> &mdash; delegated to a dedicated
 *       {@link CorsConfigurationSource} bean so the policy can be tweaked
 *       without re-compiling.</li>
 *   <li><strong>Method security</strong> &mdash; enabled so future
 *       {@code @PreAuthorize("hasRole('ADMIN')")} annotations work.</li>
 * </ul>
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    /**
     * Routes that bypass authentication. Order matters: the matcher is
     * evaluated left-to-right and the first match wins, so the most specific
     * paths come first.
     */
    private static final String[] PUBLIC_PATHS = {
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/actuator/health",
            "/actuator/info",
            "/v3/api-docs/**",
            "/v3/api-docs.yaml",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/swagger-resources/**",
            "/webjars/**"
    };

    private final JwtAuthenticationFilter jwtFilter;

    /** Comma-separated CORS allow-list; {@code *} means "any origin". */
    private final String corsAllowedOrigins;

    public SecurityConfig(
            JwtAuthenticationFilter jwtFilter,
            @Value("${app.cors.allowed-origins:}") String corsAllowedOrigins
    ) {
        this.jwtFilter = jwtFilter;
        this.corsAllowedOrigins = corsAllowedOrigins;
    }

    // ---------------------------------------------------------------------
    //  Filter chain
    // ---------------------------------------------------------------------

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(reg -> reg
                        .requestMatchers(PUBLIC_PATHS).permitAll()
                        // M1 storefront público: lectura del catálogo sin auth.
                        .requestMatchers(HttpMethod.GET, "/api/v1/products", "/api/v1/products/**").permitAll()
                        // Escrituras del catálogo: sólo ROLE_ADMIN.
                        //
                        // Antes de FE-T2 bastaba `anyRequest().authenticated()`,
                        // así que un ROLE_USER podía crear/editar/borrar
                        // productos. Con /auth/register público cualquier
                        // visitante obtains esa credencial en segundos, por lo
                        // que el catálogo queda abierto a escritura anonima.
                        .requestMatchers(HttpMethod.POST, "/api/v1/products", "/api/v1/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/products/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        // 401 for anonymous, 403 for forbidden — both as JSON
                        // problem-detail so the frontend doesn't choke on the
                        // default HTML error page.
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                            response.getWriter().write(
                                    "{\"type\":\"https://docs.stockly.example/errors/unauthorized\","
                            + "\"title\":\"Unauthorized\","
                            + "\"status\":401,"
                            + "\"detail\":\"" + safeMessage(authException) + "\"}");
                        })
                        .accessDeniedHandler((request, response, deniedException) -> {
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                            response.getWriter().write(
                                    "{\"type\":\"https://docs.stockly.example/errors/forbidden\","
                            + "\"title\":\"Forbidden\","
                            + "\"status\":403,"
                            + "\"detail\":\"" + safeMessage(deniedException) + "\"}");
                        })
                )
                // Insert the JWT filter ahead of the username/password one so
                // authenticated requests short-circuit before the form-login
                // machinery runs.
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ---------------------------------------------------------------------
    //  Beans
    // ---------------------------------------------------------------------

    /**
     * BCrypt password encoder with cost 10. Cost 10 is the Spring Security
     * default and balances hashing speed (~4ms per hash on modern hardware);
     * higher values slow legitimate logins as much as they slow attackers.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * DAO authentication provider wired to {@link StocklyUserDetailsService}
     * and the bcrypt encoder above.
     */
    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider(
            StocklyUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        var provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    /**
     * CORS policy mirrored from {@link com.stockly.config.WebMvcConfig} so the
     * security filter chain and the dispatcher servlet agree. Both can be
     * overridden via {@code app.cors.allowed-origins}.
     *
     * <p>Before FE-T2 the origins were hardcoded to the two localhost:3000
     * spellings, which silently blocked every other front-end host (the
     * public {@code POST /auth/register} call failed the preflight). The
     * list now comes from configuration; {@code *} switches to
     * {@code allowedOriginPatterns} so credentialed requests keep working.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var cfg = new CorsConfiguration();
        List<String> origins = Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        if (origins.isEmpty()) {
            // Same fallback as WebMvcConfig: empty CSV means "local dev only".
            origins = WebMvcConfig.DEFAULT_ALLOWED_ORIGINS;
        }
        if (origins.contains("*")) {
            cfg.setAllowedOriginPatterns(origins);
        } else {
            cfg.setAllowedOrigins(origins);
        }
        cfg.setAllowedMethods(Arrays.asList("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Location", "X-Request-Id"));
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cfg);
        return source;
    }

    /**
     * Minimal HTML-safe escape for the JSON message fields. Spring Security's
     * exception messages may contain double quotes; if we don't escape them
     * the JSON itself becomes malformed.
     */
    private static String safeMessage(Throwable t) {
        if (t == null || t.getMessage() == null) {
            return "";
        }
        return t.getMessage().replace("\\", "\\\\").replace("\"", "\\\"");
    }
}