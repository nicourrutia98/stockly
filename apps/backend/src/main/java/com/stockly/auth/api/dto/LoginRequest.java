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
package com.stockly.auth.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Credentials submitted to {@code POST /api/v1/auth/login}.
 *
 * <p>Both fields are mandatory and validated at the controller boundary via
 * {@code @Valid}. The password is not logged anywhere; the service layer
 * passes it to the bcrypt encoder and the encoded form is compared against
 * the stored hash.
 *
 * @param email    the user's email address (RFC 5321 valid; max
 *                 {@link com.stockly.auth.domain.User#EMAIL_MAX_LENGTH} chars)
 * @param password the user's plaintext password (max 128 chars — bcrypt itself
 *                 silently truncates at 72 bytes, but we cap earlier to keep
 *                 behaviour predictable across encoders)
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
public record LoginRequest(
        @NotBlank(message = "email is required")
        @Email(message = "email must be a well-formed address")
        @Size(max = com.stockly.auth.domain.User.EMAIL_MAX_LENGTH,
              message = "email exceeds the maximum allowed length")
        String email,

        @NotBlank(message = "password is required")
        @Size(min = 8, max = 128, message = "password must be between 8 and 128 characters")
        String password
) { }