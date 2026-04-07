package com.floatflow.controller;

import com.floatflow.dto.request.CreateFloatRequest;
import com.floatflow.dto.request.TopUpFloatRequest;
import com.floatflow.dto.response.ApiResponse;
import com.floatflow.dto.response.FloatResponse;
import com.floatflow.entity.FloatTransaction;
import com.floatflow.entity.User;
import com.floatflow.service.FloatService;
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

/**
 * Float management endpoints.
 */
@RestController
@RequestMapping("/api/floats")
@RequiredArgsConstructor
@Tag(name = "Floats", description = "Float allocation and management")
@SecurityRequirement(name = "bearerAuth")
public class FloatController {

    private final FloatService floatService;

    @PostMapping
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'ADMIN')")
    @Operation(summary = "Create a new float allocation for a branch")
    public ResponseEntity<ApiResponse<FloatResponse>> createFloat(
            @Valid @RequestBody CreateFloatRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        FloatResponse response = floatService.createFloat(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Float created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'ADMIN', 'BRANCH_MANAGER')")
    @Operation(summary = "Get all floats (Finance, Admin, Branch Manager)")
    public ResponseEntity<ApiResponse<List<FloatResponse>>> getAllFloats(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(ApiResponse.success("Floats retrieved", floatService.getAllFloats(currentUser)));
    }

    @GetMapping("/active/my-branch")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'BRANCH_MANAGER', 'FINANCE_OFFICER', 'ADMIN')")
    @Operation(summary = "Get active float for the authenticated user's branch")
    public ResponseEntity<ApiResponse<FloatResponse>> getMyBranchActiveFloat(
            @AuthenticationPrincipal User currentUser
    ) {
        FloatResponse response = floatService.getActiveFloatForMyBranch(currentUser);
        return ResponseEntity.ok(ApiResponse.success("Active float retrieved", response));
    }

    @PutMapping("/{id}/topup")
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'ADMIN', 'BRANCH_MANAGER')")
    @Operation(summary = "Top up a float balance")
    public ResponseEntity<ApiResponse<FloatResponse>> topUp(
            @PathVariable Long id,
            @Valid @RequestBody TopUpFloatRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        FloatResponse response = floatService.topUp(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Float topped up successfully", response));
    }

    @PutMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'ADMIN')")
    @Operation(summary = "Close a float allocation")
    public ResponseEntity<ApiResponse<FloatResponse>> closeFloat(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        FloatResponse response = floatService.closeFloat(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Float closed successfully", response));
    }

    @GetMapping("/{id}/transactions")
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'ADMIN', 'BRANCH_MANAGER')")
    @Operation(summary = "Get transaction history for a float")
    public ResponseEntity<ApiResponse<List<FloatTransaction>>> getTransactions(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        List<FloatTransaction> transactions = floatService.getTransactions(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Transactions retrieved", transactions));
    }
}