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

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Objects;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

/**
 * Authenticated user aggregate.
 *
 * <p>This is the only domain entity in the auth module: it carries the
 * identity (email + password hash), authorisation metadata
 * ({@link Role}), audit fields ({@code createdAt}, {@code updatedAt}),
 * optimistic-lock protection ({@link Version}) and lifecycle state
 * ({@code active}).
 *
 * <p>Spring Security integration is achieved by implementing
 * {@link UserDetails} directly: it avoids a parallel "security user" POJO and
 * keeps the access decisions co-located with the data they consult. The
 * trade-off is one extra {@code @Override} per Spring Security method
 * (most of which are no-ops) &mdash; acceptable for a single-user-type
 * application.
 *
 * <h2>Why bcrypt is not stored as a {@code byte[]}</h2>
 * <p>Bcrypt output is ASCII (a bcrypt hash is base64-ish) and the framework
 * reads it as a UTF-8 {@code String}. Storing as bytes would force callers to
 * decode before each encode-compare, which is error-prone. The column is
 * sized {@code VARCHAR(72)} &mdash; the longest a bcrypt hash can be.
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_users_email", columnNames = "email")
        }
)
@EntityListeners(AuditingEntityListener.class)
public class User implements UserDetails {

    /**
     * Maximum length of a bcrypt-encoded password hash, per RFC 7918 / bcrypt
     * specification. Defined as a constant so the column annotation and any
     * future validation agree on the same number.
     */
    public static final int PASSWORD_HASH_MAX_LENGTH = 72;

    /**
     * Maximum length of an email address, per RFC 5321 §4.5.3.1.
     * Defined as a constant so {@code @Column} and {@code @Size} (where used)
     * stay in lockstep.
     */
    public static final int EMAIL_MAX_LENGTH = 254;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "email", nullable = false, length = EMAIL_MAX_LENGTH, updatable = false)
    private String email;

    @Column(name = "password_hash", nullable = false, length = PASSWORD_HASH_MAX_LENGTH)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 32)
    private Role role = Role.ROLE_USER;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * No-arg constructor required by JPA and by Spring Security's bean
     * instantiation.
     */
    public User() {
        // JPA
    }

    /**
     * Convenience constructor used by the seeder and by integration tests.
     */
    public User(String email, String passwordHash, Role role) {
        this.email = Objects.requireNonNull(email, "email");
        this.passwordHash = Objects.requireNonNull(passwordHash, "passwordHash");
        this.role = Objects.requireNonNull(role, "role");
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Long getVersion() {
        return version;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    // ---------------------------------------------------------------------
    //  UserDetails contract
    // ---------------------------------------------------------------------

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    /**
     * Spring Security uses this as the unique identifier when looking up the
     * principal. We use the email (case-insensitive at the storage layer).
     */
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    /**
     * Honour the {@code active} flag &mdash; a deactivated user cannot
     * authenticate, even with a correct password.
     */
    @Override
    public boolean isEnabled() {
        return active;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}