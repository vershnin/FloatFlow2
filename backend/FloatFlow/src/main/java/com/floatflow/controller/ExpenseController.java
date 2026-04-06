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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@Tag(name = "Expenses", description = "Expense submission and approval workflow")
@SecurityRequirement(name = "bearerAuth")
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'BRANCH_MANAGER', 'FINANCE_OFFICER', 'ADMIN')")
    @Operation(summary = "Create a new expense (DRAFT or PENDING)")
    public ResponseEntity<ApiResponse<ExpenseResponse>> create(
            @Valid @RequestBody SubmitExpenseRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        ExpenseResponse response = expenseService.create(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Expense created successfully", response));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'BRANCH_MANAGER', 'FINANCE_OFFICER')")
    @Operation(summary = "Submit a DRAFT expense")
    public ResponseEntity<ApiResponse<ExpenseResponse>> submit(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        ExpenseResponse response = expenseService.submit(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Expense submitted successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'ADMIN')")
    @Operation(summary = "Get all expenses (Finance Officers and Admins)")
    public ResponseEntity<ApiResponse<List<ExpenseResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Expenses retrieved", expenseService.getAllExpenses()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER', 'BRANCH_MANAGER', 'EMPLOYEE', 'AUDITOR')")
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
    public ResponseEntity<ApiResponse<List<ExpenseResponse>>> getPending(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Pending expenses retrieved", expenseService.getPendingExpenses(currentUser))
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

    /**
     * FIX G: Receipt upload endpoint — was called by SubmitExpenseModal but didn't exist.
     */

    @PutMapping("/{id}/receipt")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'BRANCH_MANAGER', 'FINANCE_OFFICER')")
    @Operation(summary = "Upload a receipt file for an expense")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadReceipt(
            @PathVariable Long id,
            @RequestParam("receipt") MultipartFile file,
            @AuthenticationPrincipal User currentUser
    ) throws IOException {

        // Basic validation
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Receipt file cannot be empty"));
        }

        long maxSize = 5L * 1024 * 1024; // 5 MB
        if (file.getSize() > maxSize) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Receipt file must be under 5 MB"));
        }

        String contentType = file.getContentType();
        if (contentType == null ||
                (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only image files and PDFs are accepted"));
        }

        // Save to local disk: uploads/receipts/{expenseId}/{uuid}.{ext}
        String originalFilename = file.getOriginalFilename() != null
                ? file.getOriginalFilename() : "receipt";
        String extension = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
        String savedFilename = UUID.randomUUID() + extension;

        Path uploadDir = Paths.get("uploads", "receipts", String.valueOf(id));
        Files.createDirectories(uploadDir);

        Path destination = uploadDir.resolve(savedFilename);
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        String receiptUrl = "/uploads/receipts/" + id + "/" + savedFilename;

        // Persist the URL on the expense
        expenseService.updateReceiptUrl(id, receiptUrl, currentUser);

        return ResponseEntity.ok(ApiResponse.success("Receipt uploaded", Map.of("receiptUrl", receiptUrl)));
    }
}