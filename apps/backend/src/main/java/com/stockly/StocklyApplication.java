package com.stockly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Stockly backend entry point.
 *
 * <p>Bootstraps the Spring application context with:
 * <ul>
 *   <li>JPA auditing ({@link EnableJpaAuditing}) so {@code @CreatedDate} /
 *       {@code @LastModifiedDate} fields on entities are populated transparently.</li>
 *   <li>Layered component scanning rooted at {@code com.stockly} so
 *       {@code @RestController}, {@code @Service}, {@code @Repository} are picked up
 *       across the {@code product}, {@code auth}, and {@code shared} bounded contexts.</li>
 * </ul>
 *
 * <p>Profiles are externalized in {@code application.yml}:
 * <ul>
 *   <li>{@code dev}  → local development with auto-DDL + verbose SQL logging.</li>
 *   <li>{@code prod} → strict DDL validation, JSON encoder for log aggregation.</li>
 * </ul>
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial) Team
 * @since 0.1.0
 */
@SpringBootApplication
@EnableJpaAuditing
public class StocklyApplication {

    /**
     * Application bootstrap.
     *
     * @param args command-line arguments forwarded to Spring Boot
     */
    public static void main(String[] args) {
        SpringApplication.run(StocklyApplication.class, args);
    }
}