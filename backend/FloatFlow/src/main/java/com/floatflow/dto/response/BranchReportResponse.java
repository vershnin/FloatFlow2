package com.floatflow.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Summary report for a branch — used by Finance Officers and Auditors.
 */
@Data
@Builder
public class BranchReportResponse {
    private Long branchId;
    private String branchName;
    private BigDecimal totalFloatAllocated;
    private BigDecimal totalExpensesApproved;
    private BigDecimal remainingFloat;
    private Long pendingExpensesCount;
    private Long approvedExpensesCount;
    private Long rejectedExpensesCount;
}
