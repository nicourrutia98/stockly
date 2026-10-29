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

import com.stockly.auth.domain.Role;
import com.stockly.auth.domain.User;

/**
 * Public view of an authenticated user. Never exposes the password hash.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
public record UserResponse(
        Long id,
        String email,
        Role role,
        boolean active
) {

    /**
     * Build a public view from the JPA entity.
     */
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getRole(), u.isActive());
    }
}