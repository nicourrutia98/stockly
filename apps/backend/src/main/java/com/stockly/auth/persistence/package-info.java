/**
 * Persistence layer of the auth module: JPA repositories that translate
 * the domain primitives into queries the database understands.
 *
 * <p>The repositories extend Spring Data {@code JpaRepository} so they inherit
 * the standard CRUD operations; the only custom finders are the ones the
 * service layer actually uses (e.g. {@code findByEmail}).
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
package com.stockly.auth.persistence;