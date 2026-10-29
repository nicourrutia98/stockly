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
package com.stockly.auth.domain;

/**
 * Authorisation role for {@link com.stockly.auth.domain.User}.
 *
 * <p>Two roles only for v0.1.0:
 * <ul>
 *   <li>{@link #ROLE_USER} &mdash; regular operator; can read and update
 *       products they own (ownership not yet implemented).</li>
 *   <li>{@link #ROLE_ADMIN} &mdash; full CRUD on every product plus access
 *       to future admin endpoints (user management, analytics).</li>
 * </ul>
 *
 * <p>Stored in the database as {@code VARCHAR(32)} (see Liquibase changelog
 * {@code 0004-create-users-table.xml}). The {@code ROLE_} prefix is required
 * by Spring Security's {@code hasRole(...)} expression &mdash; it is the
 * convention, not an option.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
public enum Role {

    ROLE_USER,
    ROLE_ADMIN
}