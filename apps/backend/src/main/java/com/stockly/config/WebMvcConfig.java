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
package com.stockly.config;

import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.config.PageableHandlerMethodArgumentResolverCustomizer;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cross-cutting MVC wiring: CORS policy and {@link org.springframework.data.domain.Pageable}
 * bounds.
 *
 * <p>Values are externalised via the {@code app.cors.*} and
 * {@code app.web.pageable.*} property namespaces so that the same artifact can be
 * deployed across environments (local, staging, production) without code
 * changes. Sensible defaults cover local development against the Next.js
 * frontend at {@code http://localhost:3000}.
 *
 * <h2>Why a single WebMvcConfigurer?</h2>
 * <p>Spring allows multiple {@link WebMvcConfigurer} beans that compose their
 * callbacks additively. We keep this single bean for traceability: every
 * framework-integration decision lives in one auditable place.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebMvcConfig.class);

    /**
     * Default CORS allowed origins for the local Next.js dev server.
     * Overridable via {@code app.cors.allowed-origins} (comma-separated list).
     */
    public static final List<String> DEFAULT_ALLOWED_ORIGINS = List.of(
            "http://localhost:3000",
            "http://127.0.0.1:3000"
    );

    /**
     * Default maximum page size accepted by the
     * {@link org.springframework.data.web.PageableHandlerMethodArgumentResolver}.
     * Requested sizes above this cap are silently clamped (Spring Data default
     * behaviour) rather than rejected with 400, because the underlying query is
     * still valid — only the response window changes.
     */
    static final int DEFAULT_MAX_PAGE_SIZE = 100;

    /**
     * Default page size when the client omits the {@code ?size=} parameter.
     */
    static final int DEFAULT_PAGE_SIZE = 20;

    private final List<String> allowedOrigins;
    private final int maxPageSize;
    private final int defaultPageSize;

    public WebMvcConfig(
            @Value("${app.cors.allowed-origins:}") String allowedOriginsCsv,
            @Value("${app.web.pageable.max-page-size:" + DEFAULT_MAX_PAGE_SIZE + "}") int maxPageSize,
            @Value("${app.web.pageable.default-page-size:" + DEFAULT_PAGE_SIZE + "}") int defaultPageSize
    ) {
        this.allowedOrigins = parseOrigins(allowedOriginsCsv);
        this.maxPageSize = maxPageSize;
        this.defaultPageSize = defaultPageSize;
        log.info("CORS allowed origins: {}", this.allowedOrigins);
        log.info("Pageable defaults: size={}, max={}", this.defaultPageSize, this.maxPageSize);
    }

    /**
     * Apply the CORS registry to Spring MVC. Only {@code /api/**} is exposed;
     * actuator and Swagger paths are intentionally NOT whitelisted for the
     * browser to discourage manual exploration in production.
     */
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Location", "X-Request-Id")
                .allowCredentials(true)
                .maxAge(3600L);
    }

    /**
     * Customise the Pageable argument resolver: cap the maximum page size and
     * the default page size. The cap defends the API against memory blowups
     * caused by a client requesting {@code ?size=999999}; the default keeps
     * paginated listings snappy.
     *
     * <p>Default sort is {@code createdAt DESC} so the most recently created
     * products surface first; clients can override per-request via
     * {@code ?sort=price,asc}.
     */
    @Bean
    PageableHandlerMethodArgumentResolverCustomizer pageableCustomizer() {
        int boundedMax = maxPageSize > 0 ? maxPageSize : DEFAULT_MAX_PAGE_SIZE;
        int boundedDefault = defaultPageSize > 0 ? defaultPageSize : DEFAULT_PAGE_SIZE;

        return resolver -> {
            resolver.setMaxPageSize(boundedMax);
            resolver.setFallbackPageable(
                    PageRequest.of(0, boundedDefault, Sort.by("createdAt").descending())
            );
        };
    }

    /**
     * Parse a comma-separated CORS origin list. Falls back to the local dev
     * defaults when the property is missing or blank.
     */
    private static List<String> parseOrigins(String csv) {
        if (csv == null || csv.isBlank()) {
            return DEFAULT_ALLOWED_ORIGINS;
        }
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}