package com.floatflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Immutable audit trail.
 * FIX — DDL WARN on startup:
 *   The audit_logs table already existed without the severity column.
 *   Hibernate tried to ADD COLUMN severity varchar(16) NOT NULL which fails
 *   because existing rows have null values in that column.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_user",      columnList = "userId"),
        @Index(name = "idx_audit_entity",    columnList = "entityType, entityId"),
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

    private Long userId;

    @Column(length = 255)
    private String userName;

    @Column(length = 255)
    private String userEmail;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String entityType;

    private Long entityId;

    @Column(length = 1000)
    private String details;

    @Column(nullable = false)
    private String checksum;

    @Column(length = 64)
    private String ipAddress;

    // nullable = false removed — column may not exist yet on existing DBs.
    // @PrePersist and @Builder.Default ensure new rows always have a value.
    @Builder.Default
    @Column(length = 16)
    private String severity = "INFO";

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
        if (this.severity == null) this.severity = "INFO";
    }

    public LocalDateTime getCreatedAt() {
        return this.timestamp;
    }
}