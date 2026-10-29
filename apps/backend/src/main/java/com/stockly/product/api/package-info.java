/**
 * HTTP transport layer: REST controllers and request/response shapes.
 *
 * <p>Controllers live in {@code com.stockly.product.api}; DTOs and MapStruct
 * mappers live in {@code com.stockly.product.api.dto}; the global error
 * handler lives in {@code com.stockly.product.api.error}. The transport
 * layer is the only layer aware of HTTP semantics — domain code never
 * imports {@code org.springframework.web} types.
 *
 * <h2>Routing</h2>
 * <p>{@link com.stockly.product.api.ProductController} exposes the product
 * inventory resource at {@code /api/v1/products} (added in T5). The
 * controller is intentionally thin: HTTP-binding is delegated to Spring MVC,
 * business logic to {@code ProductService}, and error mapping to
 * {@code GlobalExceptionHandler}.
 *
 * <h2>Conventions</h2>
 * <ul>
 *   <li>POST  &rarr; 201 + {@code Location} header (RFC 7231 §6.3.2).</li>
 *   <li>GET   &rarr; 200 OK with body.</li>
 *   <li>PATCH &rarr; 200 OK with the merged resource (RFC 7396).</li>
 *   <li>DEL   &rarr; 204 No Content (soft-delete).</li>
 *   <li>All errors &rarr; RFC 7807 {@code application/problem+json}.</li>
 * </ul>
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
package com.stockly.product.api;