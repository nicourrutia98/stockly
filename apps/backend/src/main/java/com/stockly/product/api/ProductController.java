/*
 * MIT License
 *
 * Copyright (c) 2026 Juan Nicolas Urrutia Salcedo
 * Student ID: u20182173626
 * Universidad Surcolombiana de Neiva — Materia: Inteligencia Artificial
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
package com.stockly.product.api;

import java.net.URI;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.stockly.product.api.dto.CreateProductRequest;
import com.stockly.product.api.dto.ProductPageResponse;
import com.stockly.product.api.dto.ProductResponse;
import com.stockly.product.api.dto.UpdateProductRequest;
import com.stockly.product.service.ProductSearchCriteria;
import com.stockly.product.service.ProductService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * REST controller for the product inventory resource.
 *
 * <p>Exposes CRUD under {@code /api/v1/products}. The controller is intentionally
 * thin: it binds HTTP to {@link ProductService} and delegates every business
 * decision (validation, persistence, exception mapping) to the service and
 * {@code GlobalExceptionHandler}.
 *
 * <h2>HTTP semantics</h2>
 * <ul>
 *   <li>{@code POST /}         &rarr; 201 Created + {@code Location} header
 *       pointing at the new resource.</li>
 *   <li>{@code GET /{id}}      &rarr; 200 OK, 404 if not found.</li>
 *   <li>{@code GET /}          &rarr; 200 OK with paginated body.</li>
 *   <li>{@code PATCH /{id}}    &rarr; 200 OK with the merged resource;
 *       body follows RFC 7396 (null clears a field).</li>
 *   <li>{@code DELETE /{id}}   &rarr; 204 No Content (soft-delete in service).</li>
 * </ul>
 *
 * <h2>Validation strategy</h2>
 * <p>Bean-validation runs at the boundary: {@code @Valid} on bodies, member-object
 * binding for query params, and class-level {@link Validated} so path variables
 * get {@link Min} enforcement. Domain failures (404 / 409) are raised in the
 * service and translated to RFC 7807 {@code application/problem+json} by the
 * {@code GlobalExceptionHandler}.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
@RestController
@RequestMapping("/api/v1/products")
@Validated
@Tag(
        name = "Products",
        description = "Product inventory management: create, read, update and soft-delete."
)
public class ProductController {

    private static final Logger log = LoggerFactory.getLogger(ProductController.class);

    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
        log.info("ProductController initialised under /api/v1/products");
    }

    // ---------------------------------------------------------------------
    //  POST /api/v1/products
    // ---------------------------------------------------------------------

    /**
     * Create a new product. Returns the persisted entity and a {@code Location}
     * header pointing at the new resource (RFC 7231 §6.3.2).
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create a new product",
            description = "Creates a product with the given attributes. Sku must be unique."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Product created",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ProductResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation failed (RFC 7807 problem-detail)",
                    content = @Content(mediaType = "application/problem+json")
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Sku already exists (RFC 7807 problem-detail)",
                    content = @Content(mediaType = "application/problem+json")
            )
    })
    public ResponseEntity<ProductResponse> create(
            @Valid @RequestBody @NotNull CreateProductRequest request
    ) {
        log.debug("POST /api/v1/products sku={}", request.sku());
        ProductResponse created = service.create(request);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    // ---------------------------------------------------------------------
    //  GET /api/v1/products/{id}
    // ---------------------------------------------------------------------

    /**
     * Fetch a single product by its id.
     *
     * @throws com.stockly.product.service.ProductNotFoundException 404 with
     *         RFC 7807 problem-detail when no product exists for the id.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get a product by id")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Product found",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ProductResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Product not found (RFC 7807 problem-detail)",
                    content = @Content(mediaType = "application/problem+json")
            )
    })
    public ProductResponse findById(
            @PathVariable
            @NotNull
            @Min(value = 1, message = "id must be positive")
            Long id
    ) {
        log.debug("GET /api/v1/products/{}", id);
        return service.findById(id);
    }

    // ---------------------------------------------------------------------
    //  GET /api/v1/products
    // ---------------------------------------------------------------------

    /**
     * List / search products with pagination and optional filters.
     *
     * <p>Filter fields are bound from query string via {@link ModelAttribute} +
     * {@link Valid}, which works for Java records on Spring 6.1+ (Spring Boot
     * 3.4 ships with Spring Framework 6.2). Cross-field constraints declared
     * in {@link ProductSearchCriteria} (e.g. {@code minPrice <= maxPrice})
     * run automatically; on failure the {@code GlobalExceptionHandler}
     * translates the {@code ConstraintViolationException} to a 400 problem.
     *
     * @param criteria filter shape (every field optional; null = no filter).
     * @param pageable page, size, sort. Default size and max-size are
     *                 configured in {@link com.stockly.config.WebMvcConfig}.
     */
    @GetMapping
    @Operation(
            summary = "List and search products",
            description = "Returns a page of products. All query parameters are optional. "
                    + "Use `sort=field,asc|desc` to override the default `createdAt,DESC`."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Page of products (may be empty)",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ProductPageResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid filter or pagination parameters (RFC 7807 problem-detail)",
                    content = @Content(mediaType = "application/problem+json")
            )
    })
    public ProductPageResponse search(
            @Parameter(description = "Filter parameters (all optional)")
            @Valid @ModelAttribute ProductSearchCriteria criteria,
            @Parameter(
                    description = "Pagination. Default: page=0, size=20, sort=createdAt,DESC. Max size: 100.",
                    example = "page=0&size=20&sort=createdAt,desc"
            )
            Pageable pageable
    ) {
        log.debug("GET /api/v1/products criteria={} pageable={}", criteria, pageable);
        return service.search(criteria, pageable);
    }

    // ---------------------------------------------------------------------
    //  PATCH /api/v1/products/{id}
    // ---------------------------------------------------------------------

    /**
     * Partial update following RFC 7396 (JSON Merge Patch).
     *
     * <p>Semantics:
     * <ul>
     *   <li><strong>missing field</strong> &rarr; no change.</li>
     *   <li><strong>explicit {@code null}</strong> &rarr; clear (only
     *       supported for {@code description}; other nullable=false columns
     *       will fail validation).</li>
     *   <li><strong>value</strong> &rarr; overwrite.</li>
     * </ul>
     *
     * <p>The service enforces the
     * {@code @AssertTrue hasAtLeastOneField()} guard via Bean Validation, so
     * requests with every field {@code null}/{@code undefined} are rejected
     * at the controller boundary before they ever reach the persistence
     * layer.
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Partially update a product",
            description = "RFC 7396 merge-patch: missing fields are unchanged, explicit `null` clears (where allowed), value overwrites."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Updated product",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ProductResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation failed (RFC 7807 problem-detail)",
                    content = @Content(mediaType = "application/problem+json")
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Product not found (RFC 7807 problem-detail)",
                    content = @Content(mediaType = "application/problem+json")
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Concurrent modification (RFC 7807 problem-detail)",
                    content = @Content(mediaType = "application/problem+json")
            )
    })
    public ProductResponse update(
            @PathVariable
            @NotNull
            @Min(value = 1, message = "id must be positive")
            Long id,
            @Valid @RequestBody @NotNull UpdateProductRequest request
    ) {
        log.debug("PATCH /api/v1/products/{}", id);
        return service.update(id, request);
    }

    // ---------------------------------------------------------------------
    //  DELETE /api/v1/products/{id}
    // ---------------------------------------------------------------------

    /**
     * Soft-delete a product (sets {@code active=false}, preserves history).
     *
     * <p>Returns 204 with no body, per the REST convention for successful
     * deletes. The product disappears from default listings but can still be
     * recovered by an admin using a future restore endpoint (post-MVP).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
            summary = "Soft-delete a product",
            description = "Marks the product as inactive (soft delete). Returns 204 No Content on success."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Product soft-deleted"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Product not found (RFC 7807 problem-detail)",
                    content = @Content(mediaType = "application/problem+json")
            )
    })
    public void delete(
            @PathVariable
            @NotNull
            @Min(value = 1, message = "id must be positive")
            Long id
    ) {
        log.info("DELETE /api/v1/products/{}", id);
        service.delete(id);
    }
}