/*
 * MIT License — Copyright (c) 2026 Juan Nicolas Urrutia Salcedo
 * Student ID: u20182173626 · Universidad Surcolombiana de Neiva
 * Materia: Inteligencia Artificial · See LICENSE for the full text.
 */
package com.stockly.auth.service;

/**
 * Raised when registration targets an email that already exists.
 *
 * <p>Mapped to {@code 409 Conflict} by the shared
 * {@link com.stockly.product.api.error.GlobalExceptionHandler}. The email is
 * carried as a ProblemDetail extension so clients can highlight the field
 * without parsing the message.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
public class EmailAlreadyRegisteredException extends RuntimeException {

    private final String email;

    public EmailAlreadyRegisteredException(String email) {
        super("Email already registered: " + email);
        this.email = email;
    }

    public String getEmail() {
        return email;
    }
}
