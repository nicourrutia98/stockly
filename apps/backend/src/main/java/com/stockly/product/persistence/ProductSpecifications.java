package com.stockly.product.persistence;

import com.stockly.product.domain.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

/**
 * Type-safe, composable JPA {@link Specification} factories for filtering
 * {@link Product} queries.
 *
 * <p>Each method returns a {@code Specification<Product>} that is either
 * <em>active</em> (adds a {@code WHERE} predicate) or <em>no-op</em>
 * ({@code null}) so the caller can chain with
 * {@link Specification#where(Specification) Specification.where(...)}
 * without runtime null checks. This pattern keeps the service layer (T4)
 * agnostic of which filters are present:
 *
 * <pre>{@code
 *     Specification<Product> spec = Specification.where(null);
 *     if (req.search() != null)   spec = spec.and(ProductSpecifications.searchLike(req.search()));
 *     if (req.category() != null) spec = spec.and(ProductSpecifications.hasCategory(req.category()));
 *     if (req.active() != null)   spec = spec.and(ProductSpecifications.isActive(req.active()));
 *     if (req.minPrice() != null || req.maxPrice() != null) {
 *         spec = spec.and(ProductSpecifications.priceBetween(req.minPrice(), req.maxPrice()));
 *     }
 *     if (req.inStockOnly() != null && req.inStockOnly()) {
 *         spec = spec.and(ProductSpecifications.inStockOnly());
 *     }
 *     return productRepository.findAll(spec, pageable);
 * }</pre>
 *
 * <h2>String matching</h2>
 * <p>{@link #searchLike(String)} performs a case-insensitive
 * {@code LIKE '%term%'} on {@code name} and {@code sku}. The wildcard is
 * user-supplied, so {@code search} is passed through {@link #escapeLike(String)}
 * to neutralize any embedded {@code %} or {@code _} (otherwise a user typing
 * {@code 50%} would over-match). The escape character is the database default
 * ({@code \}) and is consistent with PostgreSQL's
 * {@code ESCAPE '\' (default)} setting.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
public final class ProductSpecifications {

    /**
     * LIKE wildcard escape character. PostgreSQL defaults to {@code \};
     * we hardcode it here so the {@code ESCAPE} clause is explicit and does
     * not depend on session settings.
     */
    private static final char LIKE_ESCAPE = '\\';

    private ProductSpecifications() {
        // utility class — no instances
    }

    /**
     * Case-insensitive substring match on {@code name} and {@code sku}.
     * Returns {@code null} when {@code term} is null/empty (no-op).
     *
     * @param term raw user-supplied term (NOT pre-escaped)
     * @return spec adding the {@code OR} predicate, or {@code null}
     */
    public static Specification<Product> searchLike(String term) {
        if (term == null || term.isBlank()) {
            return null;
        }
        String pattern = "%" + escapeLike(term.trim()) + "%";
        return (root, query, cb) -> cb.or(
            cb.like(cb.lower(root.get("name")), pattern.toLowerCase(), LIKE_ESCAPE),
            cb.like(cb.lower(root.get("sku")), pattern.toLowerCase(), LIKE_ESCAPE)
        );
    }

    /**
     * Equality match on {@code category}. Returns {@code null} when
     * {@code category} is null/empty.
     *
     * @param category the category label to match exactly
     * @return spec adding the predicate, or {@code null}
     */
    public static Specification<Product> hasCategory(String category) {
        if (category == null || category.isBlank()) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("category"), category);
    }

    /**
     * Equality match on {@code active}. Returns {@code null} when
     * {@code active} is null (no filter — caller controls the default).
     *
     * @param active the boolean flag to match
     * @return spec adding the predicate, or {@code null}
     */
    public static Specification<Product> isActive(Boolean active) {
        if (active == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("active"), active);
    }

    /**
     * Inclusive price range. Either bound may be {@code null}.
     *
     * <p>Both bounds are inclusive because the spec front-end ({@code Zod})
     * uses {@code gte}/{@code lte} on a numeric input. Returns {@code null}
     * when both bounds are null (no filter).
     *
     * @param min inclusive lower bound (may be null)
     * @param max inclusive upper bound (may be null)
     * @return spec adding the predicate, or {@code null}
     */
    public static Specification<Product> priceBetween(BigDecimal min, BigDecimal max) {
        if (min == null && max == null) {
            return null;
        }
        return (root, query, cb) -> {
            Predicate p = cb.conjunction(); // start with TRUE so single-bound filters don't crash
            if (min != null) {
                p = cb.and(p, cb.greaterThanOrEqualTo(root.get("price"), min));
            }
            if (max != null) {
                p = cb.and(p, cb.lessThanOrEqualTo(root.get("price"), max));
            }
            return p;
        };
    }

    /**
     * In-stock filter: {@code stock > 0}. Returns a non-null spec when the
     * flag is true; returns {@code null} otherwise (caller can short-circuit
     * with {@code if (Boolean.TRUE.equals(inStockOnly))}).
     *
     * @return spec adding the predicate, or {@code null}
     */
    public static Specification<Product> inStockOnly() {
        return (root, query, cb) -> cb.greaterThan(root.get("stock"), 0);
    }

    /**
     * Escape {@code %} and {@code _} in a user-supplied term so they are
     * treated as literals by SQL {@code LIKE}. The escape character is
     * {@code \}; the trailing {@code ESCAPE '\\'} clause is added by the
     * {@link #searchLike(String)} caller.
     *
     * @param raw raw user term
     * @return escaped term safe to embed in a {@code LIKE} pattern
     */
    static String escapeLike(String raw) {
        StringBuilder sb = new StringBuilder(raw.length());
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            if (c == LIKE_ESCAPE || c == '%' || c == '_') {
                sb.append(LIKE_ESCAPE);
            }
            sb.append(c);
        }
        return sb.toString();
    }
}