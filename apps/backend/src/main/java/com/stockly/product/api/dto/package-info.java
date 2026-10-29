/**
 * Data Transfer Objects (Java 17 records) and MapStruct mappers for the
 * Product HTTP surface.
 *
 * <p>Records are the preferred shape: they are immutable, concise, and pair
 * naturally with Bean Validation via constructor parameter constraints.
 * Mutation is impossible by design — defensive copies are unnecessary.
 *
 * <p>Records do <em>not</em> map 1:1 to the domain entity: derived fields
 * (e.g. {@code version}, internal flags) are omitted; presentation-only fields
 * can be added in the response without polluting the entity.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
package com.stockly.product.api.dto;