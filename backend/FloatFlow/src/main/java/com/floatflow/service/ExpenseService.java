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
import org.springframework.security.access.AccessDeniedException;
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

    @Transactional
    public ExpenseResponse create(SubmitExpenseRequest request, User submittedBy) {
        com.floatflow.entity.Float floatAllocation = floatService.findActiveFloat(request.getFloatId());

        if (!floatAllocation.getBranch().getId().equals(submittedBy.getBranch().getId())) {
            throw new BadRequestException("You can only submit expenses against your own branch's float.");
        }

        ExpenseStatus status = ExpenseStatus.PENDING;
        if (request.getStatus() != null) {
            try {
                status = ExpenseStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status: " + request.getStatus());
            }
        }

        if (status != ExpenseStatus.DRAFT && status != ExpenseStatus.PENDING) {
            throw new BadRequestException("Initial expense status must be DRAFT or PENDING.");
        }

        if (status == ExpenseStatus.PENDING) {
            validatePolicy(floatAllocation, request, submittedBy);
        }

        Expense expense = Expense.builder()
                .floatAllocation(floatAllocation)
                .submittedBy(submittedBy)
                // Use the branch loaded with the active float (managed in this transaction),
                // not the potentially detached branch proxy from the authenticated principal.
                .branch(floatAllocation.getBranch())
                .amount(request.getAmount())
                .category(request.getCategory())
                .description(request.getDescription())
                .receiptUrl(request.getReceiptUrl())
                .status(status)
                .build();

        expense = expenseRepository.save(expense);

        if (status == ExpenseStatus.PENDING) {
            afterSubmissionActions(expense, submittedBy);
        }

        log.info("Expense {} created as {} by {} for amount {}",
                expense.getId(), status, submittedBy.getEmail(), request.getAmount());
        return toResponse(expense);
    }

    private void validatePolicy(com.floatflow.entity.Float floatAllocation,
                                SubmitExpenseRequest request, User submittedBy) {
        policyEngine.validate(
                floatAllocation,
                request.getAmount(),
                request.getCategory(),
                submittedBy.getBranch().getId(),
                submittedBy.getId()
        );
    }

    private void afterSubmissionActions(Expense expense, User submittedBy) {
        auditService.log(submittedBy.getId(), AuditService.EXPENSE_SUBMITTED, "Expense",
                expense.getId(),
                "Amount: " + expense.getAmount() + ", Category: " + expense.getCategory());

        notificationService.notifyBranchManagers(
                submittedBy.getBranch().getId(),
                "expense_submitted",
                "New Expense Submitted",
                "New expense submitted by " + submittedBy.getName() + " — KES " + expense.getAmount(),
                "/approvals"
        );
    }

    @Transactional
    public ExpenseResponse submit(Long id, User submittedBy) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + id));

        if (expense.getStatus() != ExpenseStatus.DRAFT) {
            throw new BadRequestException(
                    "Only DRAFT expenses can be submitted. Current status: " + expense.getStatus());
        }

        if (!expense.getSubmittedBy().getId().equals(submittedBy.getId())) {
            throw new BadRequestException("You can only submit your own draft expenses.");
        }

        SubmitExpenseRequest request = new SubmitExpenseRequest();
        request.setAmount(expense.getAmount());
        request.setCategory(expense.getCategory());
        request.setFloatId(expense.getFloatAllocation().getId());

        validatePolicy(expense.getFloatAllocation(), request, submittedBy);

        expense.setStatus(ExpenseStatus.PENDING);
        expense = expenseRepository.save(expense);

        afterSubmissionActions(expense, submittedBy);

        log.info("Expense {} submitted by {}", expense.getId(), submittedBy.getEmail());
        return toResponse(expense);
    }

    @Transactional
    public ExpenseResponse approve(Long expenseId, ApprovalRequest request, User approver) {
        Expense expense = findPendingExpense(expenseId, approver);

        saveApproval(expense, approver, "APPROVED", request.getComment());

        expense.setStatus(ExpenseStatus.APPROVED);
        expenseRepository.save(expense);

        floatService.deductFromFloat(expense.getFloatAllocation(), expense.getAmount(), expenseId);

        auditService.log(approver.getId(), AuditService.EXPENSE_APPROVED, "Expense", expenseId,
                "Approved by: " + approver.getName());

        // Uses 5-arg overload: notifyUser(userId, type, title, message, link)
        notificationService.notifyUser(
                expense.getSubmittedBy().getId(),
                "expense_approved",
                "Expense Approved",
                "Your expense of KES " + expense.getAmount() + " has been approved by " + approver.getName(),
                "/expenses"
        );

        return toResponse(expense);
    }

    @Transactional
    public ExpenseResponse reject(Long expenseId, ApprovalRequest request, User approver) {
        Expense expense = findPendingExpense(expenseId, approver);

        saveApproval(expense, approver, "REJECTED", request.getComment());

        expense.setStatus(ExpenseStatus.REJECTED);
        expenseRepository.save(expense);

        auditService.log(approver.getId(), AuditService.EXPENSE_REJECTED, "Expense", expenseId,
                "Rejected by: " + approver.getName() + ". Reason: " + request.getComment());

        // Uses 5-arg overload: notifyUser(userId, type, title, message, link)
        notificationService.notifyUser(
                expense.getSubmittedBy().getId(),
                "expense_rejected",
                "Expense Rejected",
                "Your expense of KES " + expense.getAmount() + " was rejected. Reason: " + request.getComment(),
                "/expenses"
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

    public List<ExpenseResponse> getPendingExpenses(User user) {
        if (user.getRole() == Role.BRANCH_MANAGER) {
            if (user.getBranch() == null) {
                throw new BadRequestException("Branch manager is not assigned to any branch");
            }
            return expenseRepository.findByBranchIdAndStatusOrderByCreatedAtDesc(user.getBranch().getId(), ExpenseStatus.PENDING).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        }

        return expenseRepository.findByStatus(ExpenseStatus.PENDING).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * FIX G: Persists the uploaded receipt URL on an expense.
     * Called by ExpenseController.uploadReceipt() after saving the file to disk.
     * Only the expense owner can attach a receipt.
     */
    @Transactional
    public void updateReceiptUrl(Long expenseId, String receiptUrl, User currentUser) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));

        if (!expense.getSubmittedBy().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You can only upload receipts for your own expenses.");
        }

        expense.setReceiptUrl(receiptUrl);
        expenseRepository.save(expense);
        log.info("Receipt URL set for expense {}: {}", expenseId, receiptUrl);
    }

    private Expense findPendingExpense(Long expenseId, User approver) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));

        if (expense.getStatus() != ExpenseStatus.PENDING) {
            throw new BadRequestException(
                    "Expense is not in PENDING status. Current status: " + expense.getStatus());
        }

        if (approver.getRole() == Role.BRANCH_MANAGER) {
            if (approver.getBranch() == null || !approver.getBranch().getId().equals(expense.getBranch().getId())) {
                throw new AccessDeniedException("Branch managers can only access data for their own branch");
            }
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