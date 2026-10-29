package com.stockly.product.api.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request body for {@code PUT /api/v1/products/{id}} (full update).
 *
 * <p>Partial-update semantics (PATCH semantics) intentionally differ from the
 * TypeScript Zod schema {@code zUpdateProduct}: this record represents a
 * <em>full</em> update where every field is semantically required, but the
 * record carries null for "do not touch" because Java has no
 * "undefined" / "absent" concept. The mapper
 * ({@link ProductMapper#updateEntity}) interprets {@code null} as
 * "no change" via MapStruct's
 * {@code NullValuePropertyMappingStrategy.IGNORE}.
 *
 * <p>The contract documented for the frontend is the stricter RFC 7396
 * semantics (where {@code null} = "clear" for nullable fields like
 * {@code description}). This DTO is the backend's permissive counterpart:
 * the service layer (T4) is responsible for honoring "clear" semantics
 * explicitly when needed by issuing a separate statement.
 *
 * <p>The {@link #hasAtLeastOneField()} guard rejects empty payloads so the
 * service doesn't issue a no-op update that would still bump
 * {@code updated_at} / {@code version}.
 *
 * @param sku         optional new SKU; immutable in the current contract —
 *                    server may reject updates to this field even if provided
 * @param name        optional new name
 * @param description optional new description; nullable to clear
 * @param price       optional new price
 * @param stock       optional new stock level
 * @param category    optional new category
 * @param active      optional soft-delete flag; {@code true} reactivates a
 *                    previously deleted row, {@code false} keeps it hidden
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
public record UpdateProductRequest(
    @Size(min = 3, max = 32, message = "sku must be between 3 and 32 characters")
    @Pattern(
        regexp = "^[A-Z0-9-]+$",
        message = "sku may only contain uppercase letters, digits, and dashes"
    )
    String sku,

    @Size(min = 1, max = 200, message = "name cannot exceed 200 characters")
    String name,

    @Size(max = 2000, message = "description cannot exceed 2000 characters")
    String description,

    @DecimalMin(value = "0", inclusive = true, message = "price must be zero or greater")
    BigDecimal price,

    @Min(value = 0, message = "stock cannot be negative")
    Integer stock,

    @Size(min = 1, max = 64, message = "category cannot exceed 64 characters")
    String category,

    Boolean active
) {

    /**
     * Cross-field guard: at least one updatable field must be present.
     * Surfaced as a Bean Validation violation when the payload is entirely
     * blank or null.
     *
     * @return {@code true} when at least one field is non-null
     */
    @AssertTrue(message = "at least one field must be provided for an update")
    public boolean hasAtLeastOneField() {
        return sku != null
            || name != null
            || description != null
            || price != null
            || stock != null
            || category != null
            || active != null;
    }
}