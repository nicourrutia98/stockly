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

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Centralised OpenAPI metadata bean.
 *
 * <p>Exposed via {@code springdoc-openapi-starter-webmvc-ui} (already a project
 * dependency) and rendered by the bundled Swagger UI at
 * {@code /swagger-ui.html}. The JSON spec is also served at
 * {@code /v3/api-docs}.
 *
 * <h2>Why this lives in a separate bean</h2>
 * <p>Keeping the metadata outside {@link WebMvcConfig} ensures the OpenAPI
 * surface can be evolved independently of MVC wiring (e.g. adding security
 * schemes in T6). Each module can later expose its own
 * {@code @OpenAPIDefinition} for richer grouping.
 *
 * <h2>License & authorship</h2>
 * <p>The {@link License} object mirrors the {@code LICENSE} file in the
 * repository root. Author identification follows the format agreed with the
 * Universidad Surcolombiana de Neiva for student deliverables.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
@Configuration
public class StocklyOpenApiConfig {

    /**
     * Application display name shown in Swagger UI title.
     */
    static final String APP_NAME = "Stockly API";

    /**
     * SemVer aligned with {@code pom.xml}. Update together.
     */
    static final String APP_VERSION = "0.1.0";

    /**
     * Author's student identification, also surfaced on the {@code /about}
     * page in the web frontend.
     */
    static final String STUDENT_ID = "u20182173626";

    /**
     * Universidad Surcolombiana de Neiva main web site.
     */
    static final String UNIVERSITY_URL = "https://www.usco.edu.co";

    /**
     * Compose the singleton {@link OpenAPI} bean.
     *
     * <p>The list of {@link Server}s is intentionally empty for now: when
     * unset, springdoc derives the base URL from the request, which keeps the
     * spec correct in every environment (local, staging, prod). Once a
     * production host is known it can be added here or via
     * {@code springdoc.server-url} (no code change needed).
     */
    @Bean
    public OpenAPI stocklyOpenApi(
            @Value("${springdoc.server-url:}") String serverUrl
    ) {
        var info = new Info()
                .title(APP_NAME)
                .version(APP_VERSION)
                .description(
                        "REST API for the Stockly product inventory platform.\n\n"
                                + "## Authorship\n"
                                + "- **Author**: Juan Nicolas Urrutia Salcedo\n"
                                + "- **Student ID**: " + STUDENT_ID + "\n"
                                + "- **Institution**: Universidad Surcolombiana de Neiva (USCO)\n"
                                + "- **Course**: Inteligencia Artificial (2026)\n\n"
                                + "## Conventions\n"
                                + "- All endpoints return RFC 7807 `application/problem+json` on errors.\n"
                                + "- Pagination defaults: page=0, size=20 (max 100).\n"
                                + "- Monetary amounts use `BigDecimal` with 2 decimal places.\n"
                                + "- PATCH semantics follow RFC 7396 (JSON Merge Patch).\n"
                )
                .contact(new Contact()
                        .name("Juan Nicolas Urrutia Salcedo")
                        .url(UNIVERSITY_URL)
                        .email("contact-via-" + UNIVERSITY_URL.replace("https://", "")))
                .license(new License()
                        .name("MIT License")
                        .url("https://opensource.org/licenses/MIT")
                        .identifier("MIT"));

        var openApi = new OpenAPI().info(info);

        if (serverUrl != null && !serverUrl.isBlank()) {
            openApi.servers(List.of(new Server().url(serverUrl).description("Configured server")));
        }

        return openApi;
    }
}