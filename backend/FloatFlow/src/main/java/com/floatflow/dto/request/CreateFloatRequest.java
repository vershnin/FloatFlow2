package com.floatflow.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateFloatRequest {

    @NotNull(message = "Branch ID is required")
    private Long branchId;

    @NotNull
    @DecimalMin(value = "1.00", message = "Initial amount must be at least 1.00")
    private BigDecimal initialAmount;
}
