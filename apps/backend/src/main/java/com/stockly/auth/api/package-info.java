/**
 * Public API surface of the auth module: the REST controller
 * ({@link com.stockly.auth.api.AuthController}) and the DTO records it
 * accepts and returns.
 *
 * <p>The controller is intentionally thin: it binds HTTP to
 * {@link com.stockly.auth.service.AuthService} and delegates every business
 * decision (credential verification, token issuance, blacklist lookup) to
 * the service. Error responses follow RFC 7807 and are produced by the
 * shared {@link com.stockly.product.api.error.GlobalExceptionHandler}.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
package com.stockly.auth.api;