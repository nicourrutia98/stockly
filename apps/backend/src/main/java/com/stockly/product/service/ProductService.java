package com.stockly.product.service;

import com.stockly.product.api.dto.CreateProductRequest;
import com.stockly.product.api.dto.ProductMapper;
import com.stockly.product.api.dto.ProductPageResponse;
import com.stockly.product.api.dto.ProductResponse;
import com.stockly.product.api.dto.UpdateProductRequest;
import com.stockly.product.domain.Product;
import com.stockly.product.persistence.ProductRepository;
import com.stockly.product.persistence.ProductSpecifications;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Transactional orchestration for the product aggregate.
 *
 * <h2>Transaction strategy</h2>
 * <p>Class-level {@link Transactional} with {@code readOnly = true} is the
 * default. Read methods ({@link #findById(Long)}, {@link #search})
 * inherit it. Write methods ({@link #create(CreateProductRequest)},
 * {@link #update(Long, UpdateProductRequest)}, {@link #delete(Long)}) override
 * with {@link Transactional} (no {@code readOnly}) to opt into a
 * read-write transaction.
 *
 * <h2>Soft-delete semantics</h2>
 * <p>{@link #delete(Long)} flips {@code active = false} instead of issuing a
 * physical {@code DELETE}. This preserves referential integrity for any
 * future analytics (T8) and lets the frontend hide the row via the
 * {@code active} filter without losing history.
 *
 * <h2>Concurrency</h2>
 * <ul>
 *   <li><b>SKU uniqueness (race):</b> pre-check via
 *   {@link ProductRepository#existsBySku(String)} is non-atomic with the
 *   insert, so {@link ProductSkuConflictException} is also raised when the
 *   database throws {@code DataIntegrityViolationException}
 *   (PostgreSQL {@code 23505}). The handler does the translation.</li>
 *   <li><b>Lost updates:</b> the entity carries {@code @Version} (T2).
 *   Hibernate raises {@code ObjectOptimisticLockingFailureException} on
 *   conflict, which the handler maps to {@code 409 Conflict}.</li>
 * </ul>
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
@Service
@Transactional(readOnly = true)
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository repository;
    private final ProductMapper mapper;

    /**
     * Constructor injection (no Lombok &mdash; keeps the dependency graph
     * visible at a glance).
     */
    public ProductService(ProductRepository repository, ProductMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    /**
     * Fetch a single product by id. Missing ids surface as
     * {@link ProductNotFoundException} (mapped to HTTP 404 by the
     * exception handler).
     *
     * @param id the surrogate id (must not be {@code null})
     * @return the product mapped to its response DTO
     * @throws ProductNotFoundException when no row matches
     */
    public ProductResponse findById(Long id) {
        log.debug("findById(id={})", id);
        Product product = repository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
        return mapper.toResponse(product);
    }

    /**
     * List + filter + paginate. {@link ProductSearchCriteria} carries the
     * filter shape; {@link Pageable} carries pagination + sort. Filters
     * are composed lazily so a no-filter call still returns an empty page
     * (no full-table scan) once pagination is applied.
     *
     * @param criteria search criteria (filters)
     * @param pageable pagination + sort
     * @return a {@link ProductPageResponse} mirroring {@code Page<Product>}
     */
    public ProductPageResponse search(ProductSearchCriteria criteria, Pageable pageable) {
        log.debug("search(criteria={}, pageable={})", criteria, pageable);
        Specification<Product> spec = Specification.where(null);
        spec = spec.and(ProductSpecifications.searchLike(criteria.search()));
        spec = spec.and(ProductSpecifications.hasCategory(criteria.category()));
        spec = spec.and(ProductSpecifications.isActive(criteria.active()));
        spec = spec.and(ProductSpecifications.priceBetween(criteria.minPrice(), criteria.maxPrice()));
        if (Boolean.TRUE.equals(criteria.inStockOnly())) {
            spec = spec.and(ProductSpecifications.inStockOnly());
        }
        Page<Product> page = repository.findAll(spec, pageable);
        return new ProductPageResponse(
            page.getContent().stream().map(mapper::toResponse).toList(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
    }

    /**
     * Create a new product. Performs a pre-check on the SKU and a
     * DB-side UNIQUE constraint as defense in depth.
     *
     * @param request the create payload (must not be {@code null})
     * @return the persisted product as a response DTO
     * @throws ProductSkuConflictException when the SKU is already taken
     */
    @Transactional
    public ProductResponse create(CreateProductRequest request) {
        log.info("create(sku={}, category={})", request.sku(), request.category());
        if (repository.existsBySku(request.sku())) {
            throw new ProductSkuConflictException(request.sku());
        }
        Product product = mapper.toEntity(request);
        Product saved = repository.save(product);
        log.info("created product id={} sku={}", saved.getId(), saved.getSku());
        return mapper.toResponse(saved);
    }

    /**
     * Partial update. Loads the existing row, applies the non-null fields
     * from {@link UpdateProductRequest} via the mapper's
     * {@code NullValuePropertyMappingStrategy.IGNORE} policy, and saves.
     *
     * <p>The {@code sku} field is not updatable in this version (the
     * {@code ProductMapper} ignores it on update and the entity declares
     * {@code @Column(updatable = false)}). If you ever want to support
     * SKU renames, add a dedicated endpoint and a migration story first.
     *
     * @param id      the id of the product to update
     * @param request the partial-update payload
     * @return the updated product as a response DTO
     * @throws ProductNotFoundException when no row matches the id
     */
    @Transactional
    public ProductResponse update(Long id, UpdateProductRequest request) {
        log.info("update(id={}, hasName={}, hasPrice={})",
            id, request.name() != null, request.price() != null);
        Product existing = repository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
        mapper.updateEntity(existing, request);
        Product saved = repository.save(existing);
        log.info("updated product id={} new version={}", saved.getId(), saved.getVersion());
        return mapper.toResponse(saved);
    }

    /**
     * Soft-delete: flips {@code active} to {@code false} instead of
     * removing the row. Subsequent reads with {@code active = true}
     * filters will hide the row.
     *
     * @param id the id of the product to soft-delete
     * @throws ProductNotFoundException when no row matches the id
     */
    @Transactional
    public void delete(Long id) {
        log.info("delete(id={})", id);
        Product existing = repository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
        existing.setActive(false);
        repository.save(existing);
        log.info("soft-deleted product id={}", id);
    }
}