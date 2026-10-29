package com.stockly.product.service;

import java.util.Objects;

/**
 * Domain exception thrown when a {@link com.stockly.product.domain.Product}
 * lookup by id (or by another key) returns no row.
 *
 * <p>Translated to {@code HTTP 404 Not Found} with a
 * {@link org.springframework.http.ProblemDetail} body by
 * {@code api.error.GlobalExceptionHandler}. The handler reads
 * {@code product.not.found} from {@code messages_*.properties} (with
 * {@code id} as the message argument) so the message is bilingual
 * (es-CO / en).
 *
 * <p>The {@link #getProductId()} accessor lets the handler build the
 * ProblemDetail {@code instance} property without re-parsing the message.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
public class ProductNotFoundException extends RuntimeException {

    /** The id that was searched for. {@code null} when the lookup was by another key. */
    private final Long productId;

    /**
     * Build the exception for a not-found product by id.
     *
     * @param productId the id that did not resolve; must not be {@code null}
     */
    public ProductNotFoundException(Long productId) {
        super("Product with id " + productId + " was not found");
        this.productId = productId;
    }

    /**
     * @return the id that did not resolve (never {@code null} when constructed via
     *         {@link #ProductNotFoundException(Long)})
     */
    public Long getProductId() {
        return productId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ProductNotFoundException other)) {
            return false;
        }
        return Objects.equals(productId, other.productId);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(productId);
    }
}