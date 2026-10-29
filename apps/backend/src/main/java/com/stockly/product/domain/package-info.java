/**
 * Domain layer: JPA aggregates and value objects.
 *
 * <p>Entities in this package are persistence-aware (annotated with
 * {@code @Entity}, {@code @Table}, etc.) but should not depend on frameworks
 * outside JPA + Bean Validation + Spring Data JPA. Adapters for repositories,
 * services, and HTTP transport live in sibling packages — see
 * {@code com.stockly.product} package-info for the full layout.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
package com.stockly.product.domain;