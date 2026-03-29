package com.floatflow.controller;

import com.floatflow.dto.response.ApiResponse;
import com.floatflow.entity.AuditLog;
import com.floatflow.repository.AuditLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@Tag(name = "Audit", description = "Immutable audit trail — Auditors and Admins only")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN', 'FINANCE_OFFICER')")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @Operation(summary = "Get paginated audit logs. Use ?page=0&size=20 for pagination.")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("timestamp").descending());
        Page<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampDesc(pageRequest);
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved", logs));
    }

    @GetMapping("/entity/{type}/{id}")
    @Operation(summary = "Get audit history for a specific entity (e.g., /audit/entity/Expense/42)")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getEntityAuditLogs(
        @PathVariable String type,
        @PathVariable Long id,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<AuditLog> logs = auditLogRepository
            .findByEntityTypeAndEntityIdOrderByTimestampDesc(type, id, pageRequest);
        return ResponseEntity.ok(ApiResponse.success("Entity audit logs retrieved", logs));
    }
}
