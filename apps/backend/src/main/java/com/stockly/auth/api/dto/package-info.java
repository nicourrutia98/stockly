/**
 * Auth-API data transfer records (Java 17 records) used by the auth
 * controller as request and response bodies.
 *
 * <p>Records are preferred over Lombok {@code @Data} classes because:
 * <ul>
 *   <li>They are immutable, which is appropriate for a wire format.</li>
 *   <li>They auto-generate {@code equals}, {@code hashCode}, {@code toString}
 *       and accessors.</li>
 *   <li>Bean Validation annotations ({@code @NotBlank}, {@code @Email},
 *       {@code @Size}) work on record components directly.</li>
 * </ul>
 *
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 * @since 0.1.0
 */
package com.stockly.auth.api.dto;