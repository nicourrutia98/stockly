/**
 * Application services of the auth module: the thin transactional layer that
 * orchestrates the security primitives (JWT issuance / validation, password
 * verification, token blacklisting) and the persistence layer into a
 * cohesive use-case API consumed by the controllers.
 *
 * <p>This is the only package in the auth module that talks to both
 * {@code domain} and {@code persistence}; the controllers depend on the
 * services, not on the repositories or the JPA entities.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
package com.stockly.auth.service;