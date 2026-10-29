package com.stockly.product.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * JPA aggregate root for a Product.
 *
 * <p>Layered-architecture entity (no hexagonal ports here — this is a
 * single-developer university project, see {@code package-info.java}).
 * Persistence concerns (JPA annotations) coexist with domain rules (Bean
 * Validation). Validation that should fire on persistence (e.g.
 * {@code @NotBlank}) lives on the entity so that {@code jakarta.validation}
 * cascades from repositories and from the service layer without
 * re-declaration.
 *
 * <h2>Fields</h2>
 * <ul>
 *   <li>{@code sku} — business identifier, uppercase alphanumeric with dashes,
 *       unique at the DB level ({@code UNIQUE} constraint). Immutable in
 *       practice (PATCH does not allow changing the SKU in the current API
 *       contract — see {@code UpdateProductRequest}).</li>
 *   <li>{@code price} — {@link BigDecimal} with scale 2. The frontend Zod
 *       schema is stricter ({@code .positive()} excludes zero); the backend
 *       ({@code @DecimalMin("0")}) is permissive and accepts zero as a
 *       defensive fallback for freebies, samples, or admin corrections. The
 *       asymmetry is deliberate and documented.</li>
 *   <li>{@code active} — boolean flag used for soft-delete (T4 flips it to
 *       {@code false} instead of issuing {@code DELETE}).</li>
 *   <li>{@code version} — JPA optimistic lock via {@code @Version}. Increments
 *       on every UPDATE. Lost-update conflicts surface as
 *       {@code OptimisticLockException} translated to HTTP 409 in T4.</li>
 * </ul>
 *
 * <h2>Auditing</h2>
 * <p>{@code createdAt} and {@code updatedAt} are populated by
 * {@code AuditingEntityListener}, enabled via {@code @EnableJpaAuditing} on
 * {@code StocklyApplication}. {@code createdAt} is write-once;
 * {@code updatedAt} touches on every persist.
 *
 * <h2>Lifecycle</h2>
 * <ul>
 *   <li>{@link #onCreate()} — defensive listener that ensures
 *       {@code createdAt}/{@code updatedAt} are sane even before the auditing
 *       listener fires.</li>
 *   <li>{@link #onUpdate()} — guards {@code updatedAt} from nulling on
 *       bulk operations that bypass auditing.</li>
 * </ul>
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
@Entity
@Table(
    name = "products",
    indexes = {
        @Index(name = "idx_products_sku", columnList = "sku", unique = true),
        @Index(name = "idx_products_category", columnList = "category"),
        @Index(name = "idx_products_active", columnList = "active")
    }
)
@EntityListeners(AuditingEntityListener.class)
public class Product {

    /** Auto-generated surrogate id. Never exposed as a business key. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    /**
     * Stock Keeping Unit — business identifier. Uppercase alphanumeric and
     * dashes, 3–32 chars. Unique at the DB level (mirrors the index above).
     */
    @NotBlank
    @Size(min = 3, max = 32, message = "sku must be between 3 and 32 characters")
    @Pattern(
        regexp = "^[A-Z0-9-]+$",
        message = "sku may only contain uppercase letters, digits, and dashes"
    )
    @Column(name = "sku", nullable = false, unique = true, length = 32, updatable = false)
    private String sku;

    /** Human-readable display name. Required. */
    @NotBlank
    @Size(max = 200, message = "name cannot exceed 200 characters")
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    /**
     * Optional long description. Nullable in storage; max 2000 chars.
     * PATCH semantics (RFC 7396): {@code undefined} → no change,
     * {@code null} → clear, value → overwrite. See {@code zUpdateProduct}
     * in the shared TS package for the frontend contract.
     */
    @Size(max = 2000, message = "description cannot exceed 2000 characters")
    @Column(name = "description", length = 2000)
    private String description;

    /**
     * Unit price in major units (no FX conversion at storage time). Scale 2,
     * decimal. Non-negative — see class Javadoc for the
     * {@code @DecimalMin("0")} vs Zod {@code .positive()} asymmetry.
     */
    @NotNull
    @DecimalMin(value = "0", inclusive = true, message = "price must be zero or greater")
    @Column(name = "price", nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    /** Available units in stock. Non-negative integer. */
    @NotNull
    @Min(value = 0, message = "stock cannot be negative")
    @Column(name = "stock", nullable = false)
    private Integer stock;

    /** Product category label. Free-form short string (max 64). */
    @NotBlank
    @Size(max = 64, message = "category cannot exceed 64 characters")
    @Column(name = "category", nullable = false, length = 64)
    private String category;

    /**
     * Soft-delete flag. Defaults to {@code true}. T4 service flips to
     * {@code false} on DELETE; reads filter {@code active = true} by default.
     */
    @NotNull
    @Column(name = "active", nullable = false)
    private boolean active = true;

    /** Created timestamp, write-once. Set by {@code AuditingEntityListener}. */
    @CreatedDate
    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Updated timestamp. Touched on every persist. */
    @LastModifiedDate
    @NotNull
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Optimistic-lock version. Hibernate increments on every UPDATE;
     * conflicts surface as {@code OptimisticLockException} → HTTP 409
     * (T4 handler).
     */
    @Version
    @NotNull
    @Column(name = "version", nullable = false)
    private Long version;

    /**
     * Defensive pre-persist hook. Belt-and-suspenders alongside
     * {@code @Column(nullable = false)} defaults: ensures {@code createdAt}
     * and {@code updatedAt} are populated even if the auditing listener
     * fails to bind (e.g. disabled in a test profile).
     */
    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        // 'active' is initialized at the field declaration; no-op here.
    }

    /**
     * Defensive pre-update hook. Keeps {@code updatedAt} monotonic even on
     * bulk updates that bypass {@code AuditingEntityListener}.
     */
    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    // ── Getters and setters ─────────────────────────────────────────────────

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    // ── Equality based on business identity (sku) ───────────────────────────

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Product other)) {
            return false;
        }
        // After persistence, identity is the database id. Before persistence,
        // fall back to sku (business key) so two unsaved instances of the same
        // product compare equal.
        return id != null ? id.equals(other.id) : sku != null && sku.equals(other.sku);
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : (sku != null ? sku.hashCode() : 0);
    }

    @Override
    public String toString() {
        return "Product{id=" + id + ", sku=" + sku + ", name=" + name + ", active=" + active + '}';
    }
}