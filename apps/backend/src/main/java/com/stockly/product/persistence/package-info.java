/**
 * Persistence layer for the product bounded context.
 *
 * <p>Houses the Spring Data JPA repository and the {@link
 * org.springframework.data.jpa.domain.Specification} factory used to build
 * type-safe, composable filters for the list endpoint (T5).
 *
 * <p>Why {@code JpaSpecificationExecutor}:
 * <ul>
 *   <li>Filters are dynamic (any combination of {@code search}, {@code category},
 *       {@code active}, {@code priceRange}, {@code inStock}). Method-name
 *       derived queries would explode combinatorially.</li>
 *   <li>The service layer (T4) composes specs with {@code Specification.where(...)}
 *       for null-safe predicates, then delegates to {@code findAll(spec,
 *       pageable)}.</li>
 *   <li>Pagination + sort come from Spring Data's {@code Pageable} argument, so
 *       the controller does not need to hand-roll SQL.</li>
 * </ul>
 *
 * <p>Why an explicit Specifications class (not a {@code @Query} string):
 * <ul>
 *   <li>The frontend contract (Zod) is filter-shaped — specs compose 1:1.</li>
 *   <li>DB-portability: {@code Specifications.where(...)} is part of Spring
 *       Data, not vendor SQL.</li>
 *   <li>Testability: each static factory is a pure function over {@code Root},
 *     which can be unit-tested with a {@code SpecificationTest} that does not
 *     need a real database.</li>
 * </ul>
 *
 * <h2>DB schema source of truth</h2>
 * <p>Schema is owned by Liquibase ({@code db/changelog/0001-create-products-table.xml}
 * et al.) — Hibernate runs in {@code ddl-auto=validate} mode and must not
 * modify the schema.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
package com.stockly.product.persistence;