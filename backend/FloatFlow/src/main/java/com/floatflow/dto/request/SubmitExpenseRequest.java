package com.floatflow.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SubmitExpenseRequest {

    @NotNull(message = "Float ID is required")
    private Long floatId;

    @NotNull
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "Category is required")
    private String category;

    private String description;

    // URL of uploaded receipt (frontend uploads file first, sends back URL)
    private String receiptUrl;
}
