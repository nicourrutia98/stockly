package com.stockly.product.api.dto;

import java.util.List;

/**
 * Cursor-stable, page-shaped response for {@code GET /api/v1/products}.
 *
 * <p>Carries the page slice plus minimal metadata so clients can render
 * "page X of Y" controls without a second call. The shape is intentionally
 * explicit (no leaky {@code org.springframework.data.domain.Page} type) so
 * the public API contract is owned by the application, not the framework.
 *
 * <p>The fields align with Spring Data's
 * {@code Page} getters (zero-based page index). Total page count is
 * derived server-side so the client does not need to round-trip.
 *
 * @param content        page content (slice of products)
 * @param page           zero-based page index
 * @param size           page size (max items per page)
 * @param totalElements  total products matching the filter (across all pages)
 * @param totalPages     total page count given the current size
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
public record ProductPageResponse(
    List<ProductResponse> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {

    /**
     * Empty-page factory for filters that yield no results — keeps the
     * controller free of {@code null} returns.
     *
     * @param page  zero-based page index that was requested
     * @param size  page size that was requested
     * @return an empty page with the requested shape
     */
    public static ProductPageResponse empty(int page, int size) {
        return new ProductPageResponse(List.of(), page, size, 0L, 0);
    }
}