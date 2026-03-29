package com.floatflow.dto.response;

import com.floatflow.entity.FloatStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class FloatResponse {
    private Long id;
    private Long branchId;
    private String branchName;
    private BigDecimal initialAmount;
    private BigDecimal currentBalance;
    private FloatStatus status;
    private String createdByName;
    private LocalDateTime createdAt;
    // Percentage of float remaining (useful for UI progress bars)
    private double balancePercentage;
}
