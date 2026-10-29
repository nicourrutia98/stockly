package com.stockly.product.service;

import java.util.Objects;

/**
 * Domain exception thrown when a {@link com.stockly.product.domain.Product}
 * create or update would collide with an existing row on the business
 * identifier ({@code sku}).
 *
 * <p>Translated to {@code HTTP 409 Conflict} with a
 * {@link org.springframework.http.ProblemDetail} body by
 * {@code api.error.GlobalExceptionHandler}. The handler reads
 * {@code product.sku.duplicate} from {@code messages_*.properties} with
 * {@code sku} as the message argument.
 *
 * <h2>Race-condition note</h2>
 * <p>The service layer performs a pre-check
 * ({@code ProductRepository.existsBySku(...)}) before insert. That check is
 * not atomic with the insert, so a concurrent insert can still raise a
 * {@link org.springframework.dao.DataIntegrityViolationException}
 * (translated from PostgreSQL's {@code 23505 unique_violation}). The
 * exception handler maps that to {@code ProductSkuConflictException}
 * <em>or</em> a generic 409 with the {@code error.conflict} message,
 * depending on the SQL state. See {@code GlobalExceptionHandler}.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
public class ProductSkuConflictException extends RuntimeException {

    /** The conflicting SKU. Never {@code null}. */
    private final String sku;

    /**
     * @param sku the SKU that already exists on a different row; must not be {@code null}
     */
    public ProductSkuConflictException(String sku) {
        super("A product with SKU " + sku + " already exists");
        this.sku = sku;
    }

    /**
     * @return the conflicting SKU (never {@code null})
     */
    public String getSku() {
        return sku;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ProductSkuConflictException other)) {
            return false;
        }
        return Objects.equals(sku, other.sku);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(sku);
    }
}