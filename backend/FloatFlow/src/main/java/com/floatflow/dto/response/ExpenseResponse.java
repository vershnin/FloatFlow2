package com.floatflow.dto.response;

import com.floatflow.entity.ExpenseStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ExpenseResponse {
    private Long id;
    private Long floatId;
    private String submittedByName;
    private String submittedByEmail;
    private Long branchId;
    private String branchName;
    private BigDecimal amount;
    private String category;
    private String description;
    private String receiptUrl;
    private ExpenseStatus status;
    private LocalDateTime createdAt;
}
