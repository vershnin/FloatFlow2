package com.floatflow.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown by the Policy Engine when an expense violates spending rules.
 * Returns HTTP 422 (Unprocessable Entity) — the request is valid but business rules block it.
 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class PolicyViolationException extends RuntimeException {
    public PolicyViolationException(String message) {
        super(message);
    }
}
