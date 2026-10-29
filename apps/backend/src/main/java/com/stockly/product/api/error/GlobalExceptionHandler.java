package com.stockly.product.api.error;

import com.stockly.product.service.ProductNotFoundException;
import com.stockly.product.service.ProductSkuConflictException;
import com.stockly.auth.service.EmailAlreadyRegisteredException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * RFC 7807 {@link ProblemDetail} translator for the product bounded context.
 *
 * <p>Maps domain exceptions ({@link ProductNotFoundException},
 * {@link ProductSkuConflictException}) and framework exceptions
 * ({@link MethodArgumentNotValidException},
 * {@link ObjectOptimisticLockingFailureException},
 * {@link DataIntegrityViolationException},
 * {@link HttpMessageNotReadableException},
 * {@link ConstraintViolationException}) into JSON {@code application/problem+json}
 * responses.
 *
 * <h2>Message resolution</h2>
 * <p>All human-readable strings come from {@code messages_*.properties}
 * via the auto-configured {@link MessageSource}. The current request's
 * locale (resolved by Spring's {@code LocaleContextHolder} and ultimately
 * {@code spring.web.locale-resolver: fixed} in this app) drives the
 * bundle selection: messages_es.properties for es-CO,
 * messages_en.properties for en.
 *
 * <h2>RFC 7807 extensions</h2>
 * <p>The {@code type} field is set to a documentation URI prefix
 * ({@link #PROBLEM_TYPE_BASE}) followed by a stable slug so clients can
 * pattern-match. The {@code instance} carries the request path when known
 * (left empty here &mdash; the framework fills it for top-level
 * exceptions). Domain-specific extensions (e.g. {@code sku},
 * {@code productId}, field errors) are attached via
 * {@link ProblemDetail#setProperty(String, Object)}.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
@RestControllerAdvice(basePackages = {"com.stockly.product.api", "com.stockly.auth.api"})
public class GlobalExceptionHandler {

    /**
     * Documentation URI prefix for problem types. Clients can pattern-match
     * on the path to dispatch error-handling logic. The host is a docs URL
     * stub; production deployment should point it at real docs.
     */
    static final String PROBLEM_TYPE_BASE = "https://docs.stockly.example/errors/";

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final MessageSource messageSource;

    /**
     * Constructor injection of the auto-configured {@link MessageSource}.
     */
    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    // ── Domain exceptions ────────────────────────────────────────────────────

    /**
     * Product not found &rarr; 404.
     *
     * @param ex the domain exception
     * @return a {@link ProblemDetail} with the product id as an extension
     */
    @ExceptionHandler(ProductNotFoundException.class)
    public ProblemDetail handleNotFound(ProductNotFoundException ex) {
        log.debug("ProductNotFoundException id={}", ex.getProductId());
        String message = resolveMessage("product.not.found", ex.getProductId());
        ProblemDetail pd = problem(HttpStatus.NOT_FOUND, "product-not-found", message);
        pd.setProperty("productId", ex.getProductId());
        return pd;
    }

    /**
     * SKU conflict (pre-check) &rarr; 409.
     *
     * @param ex the domain exception
     * @return a {@link ProblemDetail} with the conflicting sku as an extension
     */
    @ExceptionHandler(ProductSkuConflictException.class)
    public ProblemDetail handleSkuConflict(ProductSkuConflictException ex) {
        log.info("ProductSkuConflictException sku={}", ex.getSku());
        String message = resolveMessage("product.sku.duplicate", ex.getSku());
        ProblemDetail pd = problem(HttpStatus.CONFLICT, "product-sku-conflict", message);
        pd.setProperty("sku", ex.getSku());
        return pd;
    }

    // ── Auth exceptions (T6) ────────────────────────────────────────────────

    /**
     * Wrong credentials or unknown user &rarr; 401 with a generic message
     * (we never reveal whether the email exists).
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        log.debug("BadCredentialsException: {}", ex.getMessage());
        return problem(HttpStatus.UNAUTHORIZED, "unauthorized",
            resolveMessage("auth.unauthorized"));
    }

    /**
     * Account has been deactivated &rarr; 403 with a specific message so the
     * operator can act.
     */
    @ExceptionHandler(DisabledException.class)
    public ProblemDetail handleDisabled(DisabledException ex) {
        log.info("DisabledException: {}", ex.getMessage());
        return problem(HttpStatus.FORBIDDEN, "account-disabled",
            resolveMessage("auth.account.disabled"));
    }

    /**
     * Registration with an email that already exists &rarr; 409.
     */
    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    public ProblemDetail handleEmailAlreadyRegistered(EmailAlreadyRegisteredException ex) {
        log.info("EmailAlreadyRegisteredException");
        ProblemDetail pd = problem(HttpStatus.CONFLICT, "email-already-registered",
            resolveMessage("auth.email.exists"));
        pd.setProperty("email", ex.getEmail());
        return pd;
    }

    /**
     * Generic Spring Security authentication failure (covers cases not
     * captured by the more specific {@link BadCredentialsException}) &rarr; 401.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthentication(AuthenticationException ex) {
        log.debug("AuthenticationException class={} msg={}",
            ex.getClass().getSimpleName(), ex.getMessage());
        return problem(HttpStatus.UNAUTHORIZED, "unauthorized",
            resolveMessage("auth.unauthorized"));
    }

    /**
     * Authenticated but not allowed &rarr; 403. Routes through this when a
     * {@code @PreAuthorize("hasRole('ADMIN')")} rejects the caller.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        log.debug("AccessDeniedException: {}", ex.getMessage());
        return problem(HttpStatus.FORBIDDEN, "forbidden",
            resolveMessage("auth.forbidden"));
    }

    // ── Framework exceptions ────────────────────────────────────────────────

    /**
     * Bean Validation failure on a {@code @Valid} body &rarr; 400 with a
     * {@code errors} map (field &rarr; localized message).
     *
     * @param ex the framework exception (carries the binding result)
     * @return a {@link ProblemDetail} with field-level errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                fe -> Objects.requireNonNullElse(fe.getDefaultMessage(), "invalid value"),
                (a, b) -> a  // first wins
            ));
        log.debug("MethodArgumentNotValidException fields={}", fieldErrors.keySet());
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, "validation-failed",
            resolveMessage("validation.failed"));
        pd.setProperty("errors", fieldErrors);
        return pd;
    }

    /**
     * Bean Validation failure on path / query / request-param constraints
     * &rarr; 400.
     *
     * @param ex the framework exception (carries the violations)
     * @return a {@link ProblemDetail} with property paths &rarr; messages
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> violations = ex.getConstraintViolations().stream()
            .collect(Collectors.toMap(
                v -> v.getPropertyPath().toString(),
                ConstraintViolation::getMessage,
                (a, b) -> a
            ));
        log.debug("ConstraintViolationException paths={}", violations.keySet());
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, "validation-failed",
            resolveMessage("validation.failed"));
        pd.setProperty("errors", violations);
        return pd;
    }

    /**
     * Malformed JSON (missing body, broken JSON, type mismatch) &rarr; 400.
     *
     * @param ex the framework exception
     * @return a {@link ProblemDetail} with a generic bad-request message
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleMalformedJson(HttpMessageNotReadableException ex) {
        log.debug("HttpMessageNotReadableException: {}", ex.getMessage());
        return problem(HttpStatus.BAD_REQUEST, "malformed-request",
            resolveMessage("error.bad.request"));
    }

    /**
     * Optimistic-lock conflict (concurrent update lost) &rarr; 409.
     *
     * @param ex the Spring-translated Hibernate exception
     * @return a {@link ProblemDetail} pointing the client to retry
     */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ProblemDetail handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        log.info("OptimisticLockingFailureException class={} id={}",
            ex.getPersistentClassName(), ex.getIdentifier());
        ProblemDetail pd = problem(HttpStatus.CONFLICT, "optimistic-lock-conflict",
            resolveMessage("error.conflict"));
        pd.setProperty("retryable", true);
        return pd;
    }

    /**
     * Generic integrity violation (race-condition unique key) &rarr; 409.
     * Most often PostgreSQL {@code 23505 unique_violation} on {@code sku}
     * when two concurrent inserts pass the pre-check.
     *
     * @param ex the Spring DAO exception
     * @return a {@link ProblemDetail} with a generic conflict message
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("DataIntegrityViolationException: {}", ex.getMostSpecificCause().getMessage());
        return problem(HttpStatus.CONFLICT, "integrity-violation",
            resolveMessage("error.conflict"));
    }

    // ── Fallback ────────────────────────────────────────────────────────────

    /**
     * Last-resort handler for anything uncaught. Returns a 500 with the
     * generic internal-error message and logs the full stack trace so an
     * operator can diagnose.
     *
     * @param ex the unhandled exception
     * @return a {@link ProblemDetail} with no detail leak (the cause is
     *         NOT exposed to the client; the operator sees it in the log)
     */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "internal-error",
            resolveMessage("error.internal"));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Construct a {@link ProblemDetail} with the given status, type slug,
     * and detail message.
     *
     * @param status  HTTP status
     * @param typeSlug stable slug appended to {@link #PROBLEM_TYPE_BASE}
     * @param detail  human-readable detail (already localized)
     * @return a fully-formed {@link ProblemDetail}
     */
    private static ProblemDetail problem(HttpStatus status, String typeSlug, String detail) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setType(URI.create(PROBLEM_TYPE_BASE + typeSlug));
        pd.setTitle(status.getReasonPhrase());
        return pd;
    }

    /**
     * Resolve a message key against the auto-configured
     * {@link MessageSource} using the current request locale.
     *
     * @param key   message key (e.g. {@code product.not.found})
     * @param args  optional arguments for {@code {0}}, {@code {1}}, ...
     * @return the localized message, or the key itself if not found
     */
    private String resolveMessage(String key, Object... args) {
        Locale locale = LocaleContextHolder.getLocale();
        try {
            return messageSource.getMessage(key, args, locale);
        } catch (Exception fallback) {
            log.debug("Message key {} not found for locale {}; returning key", key, locale);
            return key;
        }
    }

    /**
     * Convenience overload for keys without arguments.
     *
     * @param key message key
     * @return the localized message
     */
    private String resolveMessage(String key) {
        return resolveMessage(key, new Object[0]);
    }

    /**
     * @return a stable, ordered view of the active ProblemDetail extension
     *         keys &mdash; handy for tests and debugging. Returns an empty
     *         list when the {@link ProblemDetail} is {@code null}.
     */
    static List<String> extensionKeys(ProblemDetail pd) {
        if (pd == null) {
            return List.of();
        }
        return pd.getProperties().keySet().stream().sorted().toList();
    }
}