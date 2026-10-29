/**
 * Product bounded context.
 *
 * <p>Contains the CRUD lifecycle for products:
 * <ul>
 *   <li>{@code domain.Product} aggregate (id, sku, name, description, price, stock,
 *       category, active, timestamps, optimistic lock).</li>
 *   <li>{@code persistence.ProductRepository} (Spring Data JPA — T3).</li>
 *   <li>{@code service.ProductService} (transactional orchestration — T4).</li>
 *   <li>{@code api.ProductController} (REST endpoints under
 *       {@code /api/v1/products}, with paged list + filter + sort — T5).</li>
 *   <li>{@code api.dto.*} Java 17 record DTOs and MapStruct mappers.</li>
 * </ul>
 *
 * <p>Package layout (layered, NOT hexagonal — single-developer university project):
 * <pre>
 *   product/
 *   ├─ domain/         JPA aggregates (entities + value objects)
 *   ├─ persistence/    Spring Data repositories (T3)
 *   ├─ service/        Transactional orchestration (T4)
 *   └─ api/            HTTP transport layer
 *      ├─ dto/         Request/response records + MapStruct mappers
 *      └─ ProductController (T5)
 * </pre>
 *
* <p>Implementation roadmap:
 * <ul>
 *   <li><b>T2:</b> {@code domain.Product} + {@code api.dto.*} records
 *       + {@code ProductMapper} (MapStruct).</li>
 *   <li><b>T3:</b> {@code persistence.ProductRepository} +
 *       {@code persistence.ProductSpecifications} (Spring Data derived queries
 *       + JPA {@code Specification} composition) + Liquibase changelog
 *       ({@code products} table + indices + constraints).</li>
 *   <li><b>T4 (this commit):</b> {@code service.ProductService}
 *       (CRUD orchestration, soft-delete, uniqueness check) +
 *       {@code api.error.GlobalExceptionHandler} (RFC 7807
 *       {@code ProblemDetail} responses for all product exceptions
 *       + framework exceptions).</li>
 *   <li><b>T5:</b> {@code api.ProductController} + OpenAPI annotations.</li>
 * </ul>
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
package com.stockly.product;