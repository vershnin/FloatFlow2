package com.floatflow.controller;

import com.floatflow.dto.response.ApiResponse;
import com.floatflow.entity.AuditLog;
import com.floatflow.repository.AuditLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Audit trail endpoints.
 */
@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@Tag(name = "Audit", description = "Immutable audit trail - Auditors and Admins only")
@SecurityRequirement(name = "bearerAuth")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")
    @Operation(summary = "Get paginated audit logs with optional filters")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo
    ) {
        // Fetch a larger page then filter in-memory for the filter params
        // that don't yet have dedicated repository methods.
        PageRequest pageRequest = PageRequest.of(0, 1000, Sort.by("timestamp").descending());
        List<AuditLog> all = auditLogRepository.findAllByOrderByTimestampDesc(pageRequest).getContent();

        // Apply optional filters
        List<AuditLog> filtered = all.stream()
                .filter(log -> entityType == null || entityType.isBlank()
                        || entityType.equalsIgnoreCase(log.getEntityType()))
                .filter(log -> userId == null
                        || userId.equals(log.getUserId()))
                .filter(log -> severity == null || severity.isBlank()
                        || severity.equalsIgnoreCase(log.getSeverity()))
                .filter(log -> {
                    if (dateFrom == null || dateFrom.isBlank()) return true;
                    LocalDateTime from = LocalDate.parse(dateFrom).atStartOfDay();
                    return log.getTimestamp() != null && !log.getTimestamp().isBefore(from);
                })
                .filter(log -> {
                    if (dateTo == null || dateTo.isBlank()) return true;
                    LocalDateTime to = LocalDate.parse(dateTo).atTime(23, 59, 59);
                    return log.getTimestamp() != null && !log.getTimestamp().isAfter(to);
                })
                .collect(Collectors.toList());

        // Manual pagination on filtered results
        int total = filtered.size();
        int fromIdx = Math.min(page * size, total);
        int toIdx   = Math.min(fromIdx + size, total);
        List<AuditLog> pageContent = filtered.subList(fromIdx, toIdx);

        Page<AuditLog> resultPage = new PageImpl<>(
                pageContent,
                PageRequest.of(page, size),
                total
        );

        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved", resultPage));
    }

    @GetMapping("/entity/{type}/{id}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")
    @Operation(summary = "Get audit history for a specific entity (e.g. /audit/entity/Expense/42)")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getEntityAuditLogs(
            @PathVariable String type,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<AuditLog> logs = auditLogRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc(type, id, pageRequest);
        return ResponseEntity.ok(ApiResponse.success("Entity audit logs retrieved", logs));
    }
}