package com.floatflow.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ExpenseDecisionEmailRequest {

    @NotNull
    private Long expenseId;

    @NotBlank
    private String status;

    @NotBlank
    private String reviewerName;

    @Email
    @NotBlank
    private String reviewerEmail;

    private String comment;

    @NotBlank
    private String submittedByName;

    @Email
    @NotBlank
    private String submittedByEmail;

    @NotNull
    private BigDecimal amount;

    @NotBlank
    private String branchName;

    @NotBlank
    private String category;

    @NotBlank
    private String description;
}
