package com.floatflow.audit;

import com.floatflow.entity.AuditLog;
import com.floatflow.entity.User;
import com.floatflow.repository.AuditLogRepository;
import com.floatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

/**
 * Immutable audit log service.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    // Standard action constants
    public static final String FLOAT_CREATED       = "FLOAT_CREATED";
    public static final String FLOAT_TOPUP         = "FLOAT_TOPUP";
    public static final String FLOAT_CLOSED        = "FLOAT_CLOSED";
    public static final String EXPENSE_SUBMITTED   = "EXPENSE_SUBMITTED";
    public static final String EXPENSE_APPROVED    = "EXPENSE_APPROVED";
    public static final String EXPENSE_REJECTED    = "EXPENSE_REJECTED";
    public static final String POLICY_CREATED      = "POLICY_CREATED";
    public static final String POLICY_UPDATED      = "POLICY_UPDATED";
    public static final String POLICY_DELETED      = "POLICY_DELETED";
    public static final String USER_REGISTERED     = "USER_REGISTERED";
    public static final String USER_LOGIN          = "USER_LOGIN";
    public static final String ADMIN_USER_CREATED      = "ADMIN_USER_CREATED";
    public static final String ADMIN_USER_UPDATED      = "ADMIN_USER_UPDATED";
    public static final String ADMIN_USER_DEACTIVATED  = "ADMIN_USER_DEACTIVATED";
    public static final String ADMIN_USER_ACTIVATED    = "ADMIN_USER_ACTIVATED";
    public static final String ADMIN_ROLE_CHANGED      = "ADMIN_ROLE_CHANGED";
    public static final String ADMIN_PASSWORD_RESET    = "ADMIN_PASSWORD_RESET";

    private static final java.util.Set<String> WARNING_ACTIONS = java.util.Set.of(
            EXPENSE_REJECTED, POLICY_DELETED
    );
    private static final java.util.Set<String> CRITICAL_ACTIONS = java.util.Set.of(
            ADMIN_USER_DEACTIVATED, ADMIN_ROLE_CHANGED, ADMIN_PASSWORD_RESET
    );

    /**
     * Primary log method — accepts pre-resolved userName and userEmail.
     * Use this from callers that already have the User object (AuthService,
     * ExpenseService, etc.) to avoid any async timing race.
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long userId, String userName, String userEmail,
                    String action, String entityType, Long entityId, String details) {
        try {
            writeLog(userId, userName, userEmail, action, entityType, entityId, details);
        } catch (Exception e) {
            log.error("Failed to write audit log for action {}: {}", action, e.getMessage());
        }
    }


    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long userId, String action, String entityType, Long entityId, String details) {
        try {
            // Null-safe lookup — never throws even if user not found yet
            String resolvedName  = "System";
            String resolvedEmail = "system@floatflow.internal";
            if (userId != null) {
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    resolvedName  = user.getName();
                    resolvedEmail = user.getEmail();
                }
            }
            writeLog(userId, resolvedName, resolvedEmail, action, entityType, entityId, details);
        } catch (Exception e) {
            log.error("Failed to write audit log for action {}: {}", action, e.getMessage());
        }
    }

    private void writeLog(Long userId, String userName, String userEmail,
                          String action, String entityType, Long entityId, String details) {
        LocalDateTime now = LocalDateTime.now();
        String checksum = sha256(userId + action + entityType + entityId + now);

        // Capture IP from request context (null-safe — not available in async/background)
        String ipAddress = null;
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                String forwarded = attrs.getRequest().getHeader("X-Forwarded-For");
                ipAddress = (forwarded != null && !forwarded.isBlank())
                        ? forwarded.split(",")[0].trim()
                        : attrs.getRequest().getRemoteAddr();
            }
        } catch (Exception ignored) { }

        String severity = "INFO";
        if (CRITICAL_ACTIONS.contains(action)) severity = "CRITICAL";
        else if (WARNING_ACTIONS.contains(action)) severity = "WARNING";

        AuditLog entry = AuditLog.builder()
                .userId(userId)
                .userName(userName)
                .userEmail(userEmail)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .checksum(checksum)
                .ipAddress(ipAddress)
                .severity(severity)
                .build();

        auditLogRepository.save(entry);
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