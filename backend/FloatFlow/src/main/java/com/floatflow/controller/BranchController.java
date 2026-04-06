package com.floatflow.controller;

import com.floatflow.dto.request.CreateBranchRequest;
import com.floatflow.dto.response.ApiResponse;
import com.floatflow.dto.response.BranchResponse;
import com.floatflow.entity.Branch;
import com.floatflow.service.BranchService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
@Tag(name = "Branches", description = "Branch management (Admins only)")
@SecurityRequirement(name = "bearerAuth")
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<Branch>>> getAllBranches() {
        return ResponseEntity.ok(ApiResponse.success("Branches retrieved", branchService.getAllBranches()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Branch>> getBranchById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Branch retrieved", branchService.getBranchById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BranchResponse>> createBranch(@Valid @RequestBody CreateBranchRequest request) {
        BranchResponse branch = branchService.createBranch(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Branch created successfully", branch));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BranchResponse>> updateBranch(
            @PathVariable Long id,
            @Valid @RequestBody CreateBranchRequest request) {
        BranchResponse branch = branchService.updateBranch(id, request);
        return ResponseEntity.ok(ApiResponse.success("Branch updated successfully", branch));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BranchResponse>> activateBranch(@PathVariable Long id) {
        BranchResponse branch = branchService.setBranchActive(id, true);
        return ResponseEntity.ok(ApiResponse.success("Branch activated successfully", branch));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BranchResponse>> deactivateBranch(@PathVariable Long id) {
        BranchResponse branch = branchService.setBranchActive(id, false);
        return ResponseEntity.ok(ApiResponse.success("Branch deactivated successfully", branch));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBranch(@PathVariable Long id) {
        branchService.deleteBranch(id);
        return ResponseEntity.ok(ApiResponse.success("Branch deleted successfully", null));
    }
}
