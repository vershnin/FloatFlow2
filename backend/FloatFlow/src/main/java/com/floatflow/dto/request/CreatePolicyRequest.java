package com.floatflow.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePolicyRequest {

    @NotBlank(message = "Policy name is required")
    private String name;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull
    @DecimalMin(value = "1.00")
    private BigDecimal maxAmount;

    @NotNull
    @DecimalMin(value = "1.00")
    private BigDecimal dailyLimit;

    // Optional: null = global policy; set to apply to one branch only
    private Long branchId;
}
