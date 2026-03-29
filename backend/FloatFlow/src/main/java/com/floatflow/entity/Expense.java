package com.floatflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents a petty cash expense submitted by an employee.
 * Linked to a Float (which tracks the balance) and a Branch.
 */
@Entity
@Table(name = "expenses", indexes = {
    @Index(name = "idx_expense_status", columnList = "status"),
    @Index(name = "idx_expense_branch", columnList = "branch_id"),
    @Index(name = "idx_expense_submitted_at", columnList = "createdAt"),
    @Index(name = "idx_expense_submitted_by", columnList = "submitted_by_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "float_id", nullable = false)
    private Float floatAllocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_id", nullable = false)
    private User submittedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    // e.g., "TRAVEL", "OFFICE_SUPPLIES", "UTILITIES"
    @Column(nullable = false)
    private String category;

    @Column(length = 500)
    private String description;

    // URL to the uploaded receipt image (e.g., stored on S3 or local storage)
    private String receiptUrl;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ExpenseStatus status = ExpenseStatus.PENDING;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
