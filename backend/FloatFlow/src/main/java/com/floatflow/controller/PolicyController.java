package com.floatflow.controller;

import com.floatflow.dto.request.CreatePolicyRequest;
import com.floatflow.dto.response.ApiResponse;
import com.floatflow.entity.Policy;
import com.floatflow.entity.User;
import com.floatflow.service.PolicyService;
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
@RequestMapping("/api/policies")
@RequiredArgsConstructor
@Tag(name = "Policies", description = "Spending policy management (Finance Officers only)")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'ADMIN')")
public class PolicyController {

    private final PolicyService policyService;

    @PostMapping
    public ResponseEntity<ApiResponse<Policy>> create(
        @Valid @RequestBody CreatePolicyRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        Policy policy = policyService.createPolicy(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Policy created", policy));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Policy>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Policies retrieved", policyService.getAllPolicies()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Policy>> update(
        @PathVariable Long id,
        @Valid @RequestBody CreatePolicyRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        Policy policy = policyService.updatePolicy(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Policy updated", policy));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
        @PathVariable Long id,
        @AuthenticationPrincipal User currentUser
    ) {
        policyService.deletePolicy(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Policy deactivated", null));
    }
}
