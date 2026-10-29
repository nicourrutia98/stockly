/*
 * MIT License — Copyright (c) 2026 Juan Nicolas Urrutia Salcedo
 * Student ID: u20182173626 · Universidad Surcolombiana de Neiva
 * Materia: Inteligencia Artificial · See LICENSE for the full text.
 */
package com.stockly.auth.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Payload for {@code POST /api/v1/auth/register}.
 *
 * <p>Only email + password: the v0.1.0 {@code users} table has no
 * display-name column, so accepting one here would silently discard data.
 * New accounts are always created with {@code ROLE_USER}; administrators
 * are provisioned by the seeder / database operator.
 *
 * @param email    RFC 5321 address, max 254 chars
 * @param password min 8, max 128, must contain lower-case, upper-case and a digit
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
public record RegisterRequest(
        @NotBlank
        @Email
        @Size(max = 254)
        String email,

        @NotBlank
        @Size(min = 8, max = 128)
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
                message = "must contain a lowercase letter, an uppercase letter and a digit"
        )
        String password
) {
}
