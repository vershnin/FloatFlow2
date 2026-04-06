package com.floatflow.controller;

import com.floatflow.dto.response.ApiResponse;
import com.floatflow.dto.response.BranchReportResponse;
import com.floatflow.service.ReportingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Financial summary reports")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportingService reportingService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'ADMIN', 'AUDITOR')")
    @Operation(summary = "Get expense summary across all branches")
    public ResponseEntity<ApiResponse<List<BranchReportResponse>>> getSummary() {
        return ResponseEntity.ok(
            ApiResponse.success("Summary report generated", reportingService.getSummaryReport())
        );
    }

    @GetMapping("/branch/{id}")
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'ADMIN', 'AUDITOR')")
    @Operation(summary = "Get detailed report for a specific branch")
    public ResponseEntity<ApiResponse<BranchReportResponse>> getBranchReport(@PathVariable Long id) {
        return ResponseEntity.ok(
            ApiResponse.success("Branch report generated", reportingService.getBranchReport(id))
        );
    }
}
