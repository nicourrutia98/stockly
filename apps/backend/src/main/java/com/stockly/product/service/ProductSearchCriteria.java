package com.stockly.product.service;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Immutable filter shape for {@link ProductService#search(ProductSearchCriteria, org.springframework.data.domain.Pageable)}.
 *
 * <p>Represents the query string the frontend sends to
 * {@code GET /api/v1/products} (T5). Each component is optional &mdash;
 * {@code null} means "no filter on this dimension" so the service can
 * compose a {@link org.springframework.data.jpa.domain.Specification} chain
 * without null-checks at every step.
 *
 * <h2>Bean Validation</h2>
 * <p>Constraints are enforced when the controller (T5) annotates the
 * parameter with {@code @Valid}. The cross-field
 * {@link #isRangeValid()} method keeps {@code minPrice <= maxPrice} when
 * both are supplied.
 *
 * <h2>Why a record</h2>
 * <p>The shape is purely data; the cross-field rule and the
 * {@link #hasAnyFilter()} helper are the only behaviour. A Java record
 * delivers immutability, equals/hashCode/toString, and accessor methods in
 * one line &mdash; no Lombok needed.
 *
 * @param search      free-text term matched (case-insensitive {@code LIKE})
 *                    against {@code name} and {@code sku}
 * @param category    exact category match
 * @param active      soft-delete flag filter; {@code null} = no filter
 * @param minPrice    inclusive lower bound on {@code price}
 * @param maxPrice    inclusive upper bound on {@code price}
 * @param inStockOnly when {@code true}, restrict to {@code stock > 0}
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
public record ProductSearchCriteria(
    @Size(max = 100, message = "search term cannot exceed 100 characters")
    String search,

    @Size(max = 64, message = "category cannot exceed 64 characters")
    String category,

    Boolean active,

    @DecimalMin(value = "0", inclusive = true, message = "minPrice must be zero or greater")
    BigDecimal minPrice,

    @DecimalMin(value = "0", inclusive = true, message = "maxPrice must be zero or greater")
    BigDecimal maxPrice,

    Boolean inStockOnly
) {

    /**
     * Cross-field validation: when both bounds are supplied, the lower one
     * must not exceed the upper one. Returned via Bean Validation
     * ({@code @AssertTrue}) when {@code @Valid} is applied at the boundary.
     *
     * @return {@code true} when the range is valid (or partially specified)
     */
    @AssertTrue(message = "minPrice cannot be greater than maxPrice")
    public boolean isRangeValid() {
        if (minPrice == null || maxPrice == null) {
            return true;
        }
        return minPrice.compareTo(maxPrice) <= 0;
    }

    /**
     * @return {@code true} when at least one filter is set; {@code false}
     *         means "no filters at all" (the service still returns an empty
     *         page rather than a full table scan, because the controller
     *         always pairs the criteria with pagination)
     */
    public boolean hasAnyFilter() {
        return search != null
            || category != null
            || active != null
            || minPrice != null
            || maxPrice != null
            || inStockOnly != null;
    }
}