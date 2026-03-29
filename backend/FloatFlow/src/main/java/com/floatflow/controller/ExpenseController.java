package com.floatflow.controller;

import com.floatflow.dto.request.ApprovalRequest;
import com.floatflow.dto.request.SubmitExpenseRequest;
import com.floatflow.dto.response.ApiResponse;
import com.floatflow.dto.response.ExpenseResponse;
import com.floatflow.entity.User;
import com.floatflow.service.ExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@Tag(name = "Expenses", description = "Expense submission and approval workflow")
@SecurityRequirement(name = "bearerAuth")
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'BRANCH_MANAGER', 'FINANCE_OFFICER')")
    @Operation(summary = "Submit a new expense claim")
    public ResponseEntity<ApiResponse<ExpenseResponse>> submit(
        @Valid @RequestBody SubmitExpenseRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        ExpenseResponse response = expenseService.submit(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Expense submitted successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'ADMIN', 'AUDITOR')")
    @Operation(summary = "Get all expenses (Finance Officers and Admins)")
    public ResponseEntity<ApiResponse<List<ExpenseResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Expenses retrieved", expenseService.getAllExpenses()));
    }

    @GetMapping("/my")
    @Operation(summary = "Get current user's own expenses")
    public ResponseEntity<ApiResponse<List<ExpenseResponse>>> getMyExpenses(
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
            ApiResponse.success("Your expenses retrieved", expenseService.getMyExpenses(currentUser))
        );
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER', 'FINANCE_OFFICER', 'ADMIN')")
    @Operation(summary = "Get all pending expenses awaiting approval")
    public ResponseEntity<ApiResponse<List<ExpenseResponse>>> getPending() {
        return ResponseEntity.ok(
            ApiResponse.success("Pending expenses retrieved", expenseService.getPendingExpenses())
        );
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER', 'FINANCE_OFFICER', 'ADMIN')")
    @Operation(summary = "Approve an expense — triggers float deduction")
    public ResponseEntity<ApiResponse<ExpenseResponse>> approve(
        @PathVariable Long id,
        @RequestBody ApprovalRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        ExpenseResponse response = expenseService.approve(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Expense approved", response));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER', 'FINANCE_OFFICER', 'ADMIN')")
    @Operation(summary = "Reject an expense with a reason")
    public ResponseEntity<ApiResponse<ExpenseResponse>> reject(
        @PathVariable Long id,
        @RequestBody ApprovalRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        ExpenseResponse response = expenseService.reject(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Expense rejected", response));
    }
}
