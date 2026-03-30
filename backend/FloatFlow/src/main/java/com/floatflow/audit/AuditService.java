package com.floatflow.audit;

import com.floatflow.entity.AuditLog;
import com.floatflow.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

/**
 * Service for managing immutable audit logs.
 * Runs asynchronously in a new transaction to avoid blocking the main flow
 * and to ensure logs are saved even if the main transaction rolls back.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    // Standard action types used across the system
    public static final String FLOAT_CREATED = "FLOAT_CREATED";
    public static final String FLOAT_TOPUP = "FLOAT_TOPUP";
    public static final String EXPENSE_SUBMITTED = "EXPENSE_SUBMITTED";
    public static final String EXPENSE_APPROVED = "EXPENSE_APPROVED";
    public static final String EXPENSE_REJECTED = "EXPENSE_REJECTED";
    public static final String POLICY_CREATED = "POLICY_CREATED";
    public static final String POLICY_UPDATED = "POLICY_UPDATED";
    public static final String POLICY_DELETED = "POLICY_DELETED";
    public static final String USER_REGISTERED = "USER_REGISTERED";
    public static final String USER_LOGIN = "USER_LOGIN";
    public static final String ADMIN_USER_CREATED = "ADMIN_USER_CREATED";
    public static final String ADMIN_USER_UPDATED = "ADMIN_USER_UPDATED";
    public static final String ADMIN_USER_DEACTIVATED = "ADMIN_USER_DEACTIVATED";
    public static final String ADMIN_USER_ACTIVATED = "ADMIN_USER_ACTIVATED";
    public static final String ADMIN_ROLE_CHANGED = "ADMIN_ROLE_CHANGED";
    public static final String ADMIN_PASSWORD_RESET = "ADMIN_PASSWORD_RESET";

    /**
     * Records an audit entry with a SHA-256 checksum for integrity.
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long userId, String action, String entityType, Long entityId, String details) {
        try {
            LocalDateTime now = LocalDateTime.now();
            String checksumInput = userId + action + entityType + entityId + now;
            String checksum = sha256(checksumInput);

            AuditLog entry = AuditLog.builder()
                .userId(userId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .checksum(checksum)
                .build();

            auditLogRepository.save(entry);
        } catch (Exception e) {
            // Never let audit logging crash the main application
            log.error("Failed to write audit log for action {}: {}", action, e.getMessage());
        }
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return "checksum-error";
        }
    }
}
