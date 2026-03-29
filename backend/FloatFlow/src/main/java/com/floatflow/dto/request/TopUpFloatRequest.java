package com.floatflow.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TopUpFloatRequest {

    @NotNull
    @DecimalMin(value = "1.00", message = "Top-up amount must be at least 1.00")
    private BigDecimal amount;

    // Optional reference (e.g., M-Pesa transaction ID)
    private String reference;
}
