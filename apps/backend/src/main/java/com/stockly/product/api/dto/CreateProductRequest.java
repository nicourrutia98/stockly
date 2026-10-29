package com.stockly.product.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request body for {@code POST /api/v1/products}.
 *
 * <p>Carries all the fields required to create a new product. SKU is the
 * business key and must be unique server-side (the unique index on
 * {@code products.sku} enforces this; a duplicate surfaces as a
 * {@code DataIntegrityViolationException} translated to HTTP 409 in T4).
 *
 * <p>The frontend Zod schema {@code zCreateProduct} in
 * {@code packages/shared/src/types/product.ts} mirrors these constraints
 * 1:1. The {@code price} field is the one place where the frontend is
 * stricter ({@code .positive()} excludes zero); see {@link Product} for the
 * rationale.
 *
 * @param sku         business identifier, 3–32 chars, uppercase alphanumeric
 *                    with dashes; unique server-side
 * @param name        human-readable display name; required, max 200 chars
 * @param description optional long description; nullable, max 2000 chars
 * @param price       unit price, scale 2, non-negative
 * @param stock       available units, non-negative integer
 * @param category    free-form category label, required, max 64 chars
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
public record CreateProductRequest(
    @NotBlank
    @Size(min = 3, max = 32, message = "sku must be between 3 and 32 characters")
    @Pattern(
        regexp = "^[A-Z0-9-]+$",
        message = "sku may only contain uppercase letters, digits, and dashes"
    )
    String sku,

    @NotBlank
    @Size(max = 200, message = "name cannot exceed 200 characters")
    String name,

    @Size(max = 2000, message = "description cannot exceed 2000 characters")
    String description,

    @NotNull
    @DecimalMin(value = "0", inclusive = true, message = "price must be zero or greater")
    BigDecimal price,

    @NotNull
    @Min(value = 0, message = "stock cannot be negative")
    Integer stock,

    @NotBlank
    @Size(max = 64, message = "category cannot exceed 64 characters")
    String category
) {
}