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
package com.stockly.auth.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.stockly.auth.domain.User;

/**
 * Repository for {@link User}.
 *
 * <p>Extends {@link JpaRepository} so the standard CRUD operations are
 * inherited. The only bespoke finder is {@link #findByEmail(String)} which is
 * used by the authentication flow (login) and by
 * {@link com.stockly.auth.security.StocklyUserDetailsService}.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Look up a user by their (case-sensitive) email. Emails are canonicalised to
     * lower case by the seeder and during registration, so a literal
     * case-sensitive lookup is sufficient.
     *
     * @param email the user's email address
     * @return the user if present, else empty
     */
    Optional<User> findByEmail(String email);

    /**
     * Existence check used by future registration endpoints to short-circuit
     * the round-trip when the email is already taken.
     */
    boolean existsByEmail(String email);
}