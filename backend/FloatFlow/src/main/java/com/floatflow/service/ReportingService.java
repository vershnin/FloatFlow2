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
import java.util.Optional;
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

        // Sum of all non-closed float allocations for this branch
        List<com.floatflow.entity.Float> activeFloats = floatRepository.findByBranchId(branchId).stream()
            .filter(f -> f.getStatus() == FloatStatus.ACTIVE || f.getStatus() == FloatStatus.EXHAUSTED)
            .collect(Collectors.toList());

        BigDecimal totalInitial = activeFloats.stream()
            .map(com.floatflow.entity.Float::getInitialAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remainingBalance = activeFloats.stream()
            .map(com.floatflow.entity.Float::getCurrentBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalApproved = Optional.ofNullable(expenseRepository.sumApprovedByBranch(branchId))
            .orElse(BigDecimal.ZERO);

        Long pendingCount = Optional.ofNullable(expenseRepository.countByBranchAndStatus(branchId, ExpenseStatus.PENDING))
            .orElse(0L);
        Long approvedCount = Optional.ofNullable(expenseRepository.countByBranchAndStatus(branchId, ExpenseStatus.APPROVED))
            .orElse(0L);
        Long rejectedCount = Optional.ofNullable(expenseRepository.countByBranchAndStatus(branchId, ExpenseStatus.REJECTED))
            .orElse(0L);

        return BranchReportResponse.builder()
            .branchId(branchId)
            .branchName(branch.getName())
            .totalFloatAllocated(totalInitial)
            .totalExpensesApproved(totalApproved)
            .remainingFloat(remainingBalance)
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
