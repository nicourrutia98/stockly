package com.stockly.product.persistence;

import com.stockly.product.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link Product}.
 *
 * <p>Combines two complementary query surfaces:
 * <ol>
 *   <li><b>{@link JpaRepository}</b> — CRUD + pagination + sort for the
 *       single-product endpoints (T5).</li>
 *   <li><b>{@link JpaSpecificationExecutor}</b> — composable filters for the
 *       list endpoint. The service layer (T4) wires the static factories
 *       in {@link ProductSpecifications} into a {@code Specification.where(...)}
 *       chain and hands the result to {@link #findAll(org.springframework.data.jpa.domain.Specification, Pageable)}.</li>
 * </ol>
 *
 * <h2>Derived query methods (named, not {@code @Query})</h2>
 * <ul>
 *   <li>{@link #findBySku(String)} — used by the create / update flow in the
 *       service layer to detect duplicate SKUs before persisting.</li>
 *   <li>{@link #existsBySku(String)} — cheap pre-check (does not fetch the row)
 *       for the create endpoint.</li>
 *   <li>{@link #existsBySkuAndIdNot(String, Long)} — uniqueness check during
 *       updates: "does <em>any other</em> product with a different id already
 *       hold this SKU?". Without the {@code AndIdNot} suffix the update would
 *       always conflict with its own row.</li>
 *   <li>{@link #findAllByActiveTrue(Pageable)} — convenience for the default
 *       list view (soft-deleted products are excluded).</li>
 *   <li>{@link #findAllByActiveTrueAndCategory(String, Pageable)} — direct
 *       category browse when the UI does not need full filter UI.</li>
 *   <li>{@link #findAllByActiveTrueAndIdNot(Long, Pageable)} — "products
 *     related to this one" (T8 analytics).</li>
 * </ul>
 *
 * <h2>Why derived queries and not {@code @Query}</h2>
 * <p>Derived queries are validated at startup by Spring Data; misnamed
 * methods fail the boot, not the first request. For the dynamic list, the
 * spec executor avoids the parameter-explosion problem. {@code @Query}
 * strings are reserved for T8 analytics where SQL is genuinely bespoke.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
@Repository
public interface ProductRepository
        extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    /**
     * Lookup by the business identifier.
     *
     * @param sku the SKU to look up; case-sensitive (the column is uppercase by convention)
     * @return the product with that SKU, or {@link Optional#empty()} if not found
     */
    Optional<Product> findBySku(String sku);

    /**
     * Cheap existence check by SKU. Backed by {@code SELECT 1 ... LIMIT 1}
     * (Spring Data generates the optimized form).
     *
     * @param sku the SKU to test
     * @return {@code true} when at least one row matches
     */
    boolean existsBySku(String sku);

    /**
     * Uniqueness check used during updates: "does a row with this SKU exist
     * whose id is not the given one?". Returns true when there is a SKU
     * conflict with another row.
     *
     * @param sku  the SKU to test
     * @param id   the id of the product currently being updated
     * @return {@code true} when a different product already owns the SKU
     */
    boolean existsBySkuAndIdNot(String sku, Long id);

    /**
     * List all active products, paginated. Soft-deleted rows ({@code active = false})
     * are excluded.
     *
     * @param pageable pagination + sort
     * @return page of active products
     */
    Page<Product> findAllByActiveTrue(Pageable pageable);

    /**
     * List active products in a given category, paginated. Useful for the
     * category browse UI without going through the {@code Specification}
     * chain.
     *
     * @param category the exact category label
     * @param pageable pagination + sort
     * @return page of matching active products
     */
    Page<Product> findAllByActiveTrueAndCategory(String category, Pageable pageable);

    /**
     * "Related products" lookup — everything active except the given id.
     * Used by T8 analytics; exposed here so the API contract is documented
     * alongside the entity.
     *
     * @param id       the id to exclude
     * @param pageable pagination + sort
     * @return page of other active products
     */
    Page<Product> findAllByActiveTrueAndIdNot(Long id, Pageable pageable);

    /**
     * Bulk active-products lookup by id set, returning matches in the order
     * the DB returns them. Used by T8 to hydrate a cart-style multi-id query
     * without paginating.
     *
     * @param ids the ids to load
     * @return products whose id is in the set and that are still active
     */
    List<Product> findAllByIdInAndActiveTrue(List<Long> ids);
}