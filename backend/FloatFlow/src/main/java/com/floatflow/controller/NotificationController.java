package com.floatflow.controller;

import com.floatflow.dto.request.ExpenseDecisionEmailRequest;
import com.floatflow.dto.request.PendingApprovalReminderRequest;
import com.floatflow.dto.response.ApiResponse;
import com.floatflow.dto.response.EmailDispatchResponse;
import com.floatflow.entity.Notification;
import com.floatflow.entity.User;
import com.floatflow.service.EmailService;
import com.floatflow.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notifications for current user")
@SecurityRequirement(name = "bearerAuth")

public class NotificationController {

    private final NotificationService notificationService;
    private final EmailService emailService;

    @GetMapping
    @Operation(summary = "Get notification for the current user")
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications(
            @AuthenticationPrincipal User currentUser
    ) {
        List<Notification> notifications =
                notificationService.getMyNotifications(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved", notifications));
    }

    // GET /api/notifications/unread-count
    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count for the current user")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal User currentUser
    ) {
        long count = notificationService.getUnreadCount(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", Map.of("count", count))
        );
    }

    // PUT /api/notifications/{id}/read
    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        notificationService.markAsRead(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }

    // PUT /api/notifications/read-all
    @PutMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal User currentUser
    ) {
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

        @PostMapping("/email/expense-decision")
        @PreAuthorize("hasAnyRole('BRANCH_MANAGER', 'FINANCE_OFFICER', 'ADMIN')")
        @Operation(summary = "Send an expense decision email")
        public ResponseEntity<ApiResponse<EmailDispatchResponse>> sendExpenseDecisionEmail(
            @Valid @RequestBody ExpenseDecisionEmailRequest request,
            @AuthenticationPrincipal User currentUser
        ) {
        EmailDispatchResponse response = emailService.sendExpenseDecisionEmail(request);
        return ResponseEntity.ok(ApiResponse.success(
            "Expense decision email processed for " + currentUser.getEmail(),
            response
        ));
        }

        @PostMapping("/email/pending-approval-reminders")
        @PreAuthorize("hasAnyRole('BRANCH_MANAGER', 'FINANCE_OFFICER', 'ADMIN')")
        @Operation(summary = "Send pending approval reminder emails")
        public ResponseEntity<ApiResponse<EmailDispatchResponse>> sendPendingApprovalReminders(
            @Valid @RequestBody PendingApprovalReminderRequest request,
            @AuthenticationPrincipal User currentUser
        ) {
        EmailDispatchResponse response = emailService.sendPendingApprovalReminder(request);
        return ResponseEntity.ok(ApiResponse.success(
            "Pending approval reminder email processed for " + currentUser.getEmail(),
            response
        ));
        }
}
