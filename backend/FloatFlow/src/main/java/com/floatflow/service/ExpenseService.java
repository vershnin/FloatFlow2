package com.floatflow.service;

import com.floatflow.audit.AuditService;
import com.floatflow.dto.request.ApprovalRequest;
import com.floatflow.dto.request.SubmitExpenseRequest;
import com.floatflow.dto.response.ExpenseResponse;
import com.floatflow.entity.*;
import com.floatflow.exception.BadRequestException;
import com.floatflow.exception.ResourceNotFoundException;
import com.floatflow.policy.PolicyEngine;
import com.floatflow.repository.ApprovalRepository;
import com.floatflow.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ApprovalRepository approvalRepository;
    private final FloatService floatService;
    private final PolicyEngine policyEngine;
    private final NotificationService notificationService;
    private final AuditService auditService;

    /**
     * Handles expense submission, policy validation, and initial notification.
     */
    @Transactional
    public ExpenseResponse submit(SubmitExpenseRequest request, User submittedBy) {
        com.floatflow.entity.Float floatAllocation = floatService.findActiveFloat(request.getFloatId());

        // Ensure the user is submitting to their own branch's float
        if (!floatAllocation.getBranch().getId().equals(submittedBy.getBranch().getId())) {
            throw new BadRequestException("You can only submit expenses against your own branch's float.");
        }

    // Run through the policy engine before saving anything
        policyEngine.validate(
            floatAllocation,
            request.getAmount(),
            request.getCategory(),
            submittedBy.getBranch().getId(),
            submittedBy.getId()
        );

        Expense expense = Expense.builder()
            .floatAllocation(floatAllocation)
            .submittedBy(submittedBy)
            .branch(submittedBy.getBranch())
            .amount(request.getAmount())
            .category(request.getCategory())
            .description(request.getDescription())
            .receiptUrl(request.getReceiptUrl())
            .build();

        expense = expenseRepository.save(expense);

        auditService.log(submittedBy.getId(), AuditService.EXPENSE_SUBMITTED, "Expense",
            expense.getId(), "Amount: " + request.getAmount() + ", Category: " + request.getCategory());

        // Notify the branch manager
        notificationService.notifyBranchManagers(
            submittedBy.getBranch().getId(),
            "New expense submitted by " + submittedBy.getName() + " — KES " + request.getAmount()
        );

        log.info("Expense {} submitted by {} for amount {}", expense.getId(), submittedBy.getEmail(), request.getAmount());
        return toResponse(expense);
    }

    /**
     * Approves an expense and deducts the amount from the branch float.
     */
    @Transactional
    public ExpenseResponse approve(Long expenseId, ApprovalRequest request, User approver) {
        Expense expense = findPendingExpense(expenseId);

        // Record the approval decision
        saveApproval(expense, approver, "APPROVED", request.getComment());

        // Update expense status
        expense.setStatus(ExpenseStatus.APPROVED);
        expenseRepository.save(expense);

        // Deduct from float balance
        floatService.deductFromFloat(expense.getFloatAllocation(), expense.getAmount(), expenseId);

        auditService.log(approver.getId(), AuditService.EXPENSE_APPROVED, "Expense", expenseId,
            "Approved by: " + approver.getName());

        // Notify the submitter
        notificationService.notifyUser(
            expense.getSubmittedBy().getId(),
            "Your expense of KES " + expense.getAmount() + " has been APPROVED by " + approver.getName()
        );

        return toResponse(expense);
    }

    /**
     * Reject an expense. Float balance is NOT deducted.
     */
    @Transactional
    public ExpenseResponse reject(Long expenseId, ApprovalRequest request, User approver) {
        Expense expense = findPendingExpense(expenseId);

        saveApproval(expense, approver, "REJECTED", request.getComment());

        expense.setStatus(ExpenseStatus.REJECTED);
        expenseRepository.save(expense);

        auditService.log(approver.getId(), AuditService.EXPENSE_REJECTED, "Expense", expenseId,
            "Rejected by: " + approver.getName() + ". Reason: " + request.getComment());

        notificationService.notifyUser(
            expense.getSubmittedBy().getId(),
            "Your expense of KES " + expense.getAmount() + " was REJECTED. Reason: " + request.getComment()
        );

        return toResponse(expense);
    }

    public List<ExpenseResponse> getAllExpenses() {
        return expenseRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getMyExpenses(User user) {
        return expenseRepository.findBySubmittedByIdOrderByCreatedAtDesc(user.getId()).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getPendingExpenses() {
        return expenseRepository.findByStatus(ExpenseStatus.PENDING).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    private Expense findPendingExpense(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
            .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));

        if (expense.getStatus() != ExpenseStatus.PENDING) {
            throw new BadRequestException("Expense is not in PENDING status. Current status: " + expense.getStatus());
        }

        return expense;
    }

    private void saveApproval(Expense expense, User approver, String decision, String comment) {
        Approval approval = Approval.builder()
            .expense(expense)
            .approvedBy(approver)
            .decision(decision)
            .comment(comment)
            .build();
        approvalRepository.save(approval);
    }

    private ExpenseResponse toResponse(Expense e) {
        return ExpenseResponse.builder()
            .id(e.getId())
            .floatId(e.getFloatAllocation().getId())
            .submittedByName(e.getSubmittedBy().getName())
            .submittedByEmail(e.getSubmittedBy().getEmail())
            .branchId(e.getBranch().getId())
            .branchName(e.getBranch().getName())
            .amount(e.getAmount())
            .category(e.getCategory())
            .description(e.getDescription())
            .receiptUrl(e.getReceiptUrl())
            .status(e.getStatus())
            .createdAt(e.getCreatedAt())
            .build();
    }
}
