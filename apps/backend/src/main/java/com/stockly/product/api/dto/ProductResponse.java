package com.stockly.product.api.dto;

import com.stockly.product.domain.Product;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Response shape for a single Product resource.
 *
 * <p>Returned by {@code GET /api/v1/products/{id}}, {@code POST .../products},
 * and as elements inside {@link ProductPageResponse#getContent()}. The shape
 * mirrors {@link Product} 1:1 — no derived fields in the current API
 * contract. Timestamps use ISO-8601 UTC ({@link Instant}) via Jackson's
 * Java Time module (added by {@code spring-boot-starter-json} on the
 * classpath).
 *
 * <p>{@code version} is intentionally exposed so optimistic-locking
 * conflicts can be detected by the client (E-Tag style concurrency).
 *
 * @param id          surrogate id
 * @param sku         business identifier
 * @param name        display name
 * @param description optional long description
 * @param price       unit price
 * @param stock       available units
 * @param category    category label
 * @param active      soft-delete flag
 * @param createdAt   creation timestamp (UTC)
 * @param updatedAt   last-modified timestamp (UTC)
 * @param version     optimistic-lock version
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
public record ProductResponse(
    Long id,
    String sku,
    String name,
    String description,
    BigDecimal price,
    Integer stock,
    String category,
    boolean active,
    Instant createdAt,
    Instant updatedAt,
    Long version
) {

    /**
     * Convenience factory for tests that do not want to wire MapStruct.
     *
     * @param product the source entity
     * @return a response record matching the entity's current state
     */
    public static ProductResponse from(Product product) {
        return new ProductResponse(
            product.getId(),
            product.getSku(),
            product.getName(),
            product.getDescription(),
            product.getPrice(),
            product.getStock(),
            product.getCategory(),
            product.isActive(),
            product.getCreatedAt(),
            product.getUpdatedAt(),
            product.getVersion()
        );
    }
}