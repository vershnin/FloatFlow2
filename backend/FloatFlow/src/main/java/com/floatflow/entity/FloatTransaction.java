package com.floatflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Immutable ledger of every money movement on a float (top-ups, expense deductions).
 * We never delete or update these — they form an audit trail.
 */
@Entity
@Table(name = "float_transactions", indexes = {
    @Index(name = "idx_float_tx_float", columnList = "float_id"),
    @Index(name = "idx_float_tx_created", columnList = "createdAt")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloatTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "float_id", nullable = false)
    private Float floatAllocation;

    // "TOPUP", "EXPENSE_DEDUCTION", "INITIAL_ALLOCATION"
    @Column(nullable = false)
    private String type;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    // Reference note (e.g., M-Pesa transaction ID, expense ID)
    private String reference;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
