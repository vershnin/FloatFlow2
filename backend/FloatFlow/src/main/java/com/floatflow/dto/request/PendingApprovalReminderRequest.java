package com.floatflow.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PendingApprovalReminderRequest {

    @NotBlank
    private String requestedByName;

    @Email
    @NotBlank
    private String requestedByEmail;

    @NotNull
    private Integer pendingCount;

    @Valid
    @NotEmpty
    private List<PendingApprovalExpenseItem> expenses;

    @Data
    public static class PendingApprovalExpenseItem {
        @NotNull
        private Long id;

        @NotBlank
        private String submittedByName;

        @Email
        @NotBlank
        private String submittedByEmail;

        @NotNull
        private BigDecimal amount;

        @NotBlank
        private String branchName;

        @NotNull
        private LocalDateTime createdAt;
    }
}
