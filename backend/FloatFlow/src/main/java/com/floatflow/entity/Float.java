package com.floatflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents a cash float allocated to a branch.
 * Tracks the initial amount and the running current balance.
 * Uses BigDecimal for precise financial calculations — never use double/float for money!
 */
@Entity
@Table(name = "floats", indexes = {
    @Index(name = "idx_float_branch", columnList = "branch_id"),
    @Index(name = "idx_float_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Float {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    // NUMERIC(15,2) = up to 9,999,999,999,999.99 — more than enough for petty cash
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal initialAmount;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal currentBalance;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private FloatStatus status = FloatStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.currentBalance == null) {
            this.currentBalance = this.initialAmount;
        }
    }
}
