package com.floatflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * IMMUTABLE audit trail for every significant action in the system.
 * Once written, records are never updated or deleted — this ensures compliance.
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_user", columnList = "userId"),
    @Index(name = "idx_audit_entity", columnList = "entityType, entityId"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Who performed the action (user ID)
    private Long userId;

    /** User name and email are stored separately for better security**/
    @Column(length = 255)
    private String userName;

    @Column(length = 255)
    private String userEmail;

    // What action was performed (e.g., "FLOAT_CREATED", "EXPENSE_APPROVED")
    @Column(nullable = false)
    private String action;

    // What kind of entity was affected (e.g., "Float", "Expense")
    @Column(nullable = false)
    private String entityType;

    // The ID of the entity that was affected
    private Long entityId;

    // Additional details (e.g., JSON snapshot of changed fields)
    @Column(length = 1000)
    private String details;

    // SHA-256 checksum of (userId + action + entityType + entityId + timestamp)
    // Used to detect data tampering
    @Column(nullable = false)
    private String checksum;

    // IP address of the user performing the action
    @Column(length = 64)
    private String ipAddress;

    // Severity level (e.g., "INFO", "WARNING", "ERROR")
    @Builder.Default
    @Column(nullable = false, length = 16)
    private String severity = "INFO";

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
        if (this.severity == null) this.severity = "INFO";
    }

    public  LocalDateTime getCreatedAt() {
        return this.timestamp;
    }
}
