package com.floatflow.service;

import com.floatflow.dto.response.BranchReportResponse;
import com.floatflow.entity.Branch;
import com.floatflow.entity.ExpenseStatus;
import com.floatflow.entity.FloatStatus;
import com.floatflow.exception.ResourceNotFoundException;
import com.floatflow.repository.BranchRepository;
import com.floatflow.repository.ExpenseRepository;
import com.floatflow.repository.FloatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Generates financial summary reports using aggregation queries.
 * Uses @Transactional(readOnly = true) for better performance on read queries.
 */
@Service
@RequiredArgsConstructor
public class ReportingService {

    private final BranchRepository branchRepository;
    private final ExpenseRepository expenseRepository;
    private final FloatRepository floatRepository;

    @Transactional(readOnly = true)
    public BranchReportResponse getBranchReport(Long branchId) {
        Branch branch = branchRepository.findById(branchId)
            .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + branchId));

        // Sum of all active float allocations for this branch
        BigDecimal totalFloat = floatRepository.findByBranchId(branchId).stream()
            .filter(f -> f.getStatus() == FloatStatus.ACTIVE)
            .map(f -> f.getCurrentBalance())
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalApproved = expenseRepository.sumApprovedByBranch(branchId);
        Long pendingCount = expenseRepository.countByBranchAndStatus(branchId, ExpenseStatus.PENDING);
        Long approvedCount = expenseRepository.countByBranchAndStatus(branchId, ExpenseStatus.APPROVED);
        Long rejectedCount = expenseRepository.countByBranchAndStatus(branchId, ExpenseStatus.REJECTED);

        return BranchReportResponse.builder()
            .branchId(branchId)
            .branchName(branch.getName())
            .totalFloatAllocated(totalFloat)
            .totalExpensesApproved(totalApproved)
            .remainingFloat(totalFloat.subtract(totalApproved))
            .pendingExpensesCount(pendingCount)
            .approvedExpensesCount(approvedCount)
            .rejectedExpensesCount(rejectedCount)
            .build();
    }

    @Transactional(readOnly = true)
    public List<BranchReportResponse> getSummaryReport() {
        return branchRepository.findAll().stream()
            .map(branch -> getBranchReport(branch.getId()))
            .collect(Collectors.toList());
    }
}
