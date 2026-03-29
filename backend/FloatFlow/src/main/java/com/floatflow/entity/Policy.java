package com.floatflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Defines spending rules/limits that the Policy Engine enforces.
 * Can be global or branch-specific (branch = null means global).
 *
 * Example: "TRAVEL expenses cannot exceed 5,000 per day at Nairobi Branch"
 */
@Entity
@Table(name = "policies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Policy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    // Max amount per single expense
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal maxAmount;

    // Max total expenses per day for this category
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal dailyLimit;

    // Null = policy applies to all branches; set to restrict to one branch
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Builder.Default
    private boolean isActive = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
