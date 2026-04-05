package com.floatflow.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Immutable ledger of every money movement on a float.
 * Each transaction is linked to a Float (floatAllocation) and has a type (INITIAL_ALLOCATION, TOPUP, EXPENSE_DEDUCTION, CLOSED).
 */
@Entity
@Table(name = "float_transactions", indexes = {
        @Index(name = "idx_float_tx_float",   columnList = "float_id"),
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

    // LAZY relationship — must NOT be serialised directly by Jackson
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "float_id", nullable = false)
    private Float floatAllocation;

    // Expose floatId as a plain field — no lazy proxy involved
    @Transient
    @JsonProperty("floatId")
    public Long getFloatId() {
        return floatAllocation != null ? floatAllocation.getId() : null;
    }

    // Types written by FloatService: INITIAL_ALLOCATION | TOPUP | EXPENSE_DEDUCTION | CLOSED
    @Column(nullable = false)
    private String type;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    private String reference;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}