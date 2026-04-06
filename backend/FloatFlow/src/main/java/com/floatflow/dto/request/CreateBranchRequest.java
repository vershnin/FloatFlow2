package com.floatflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBranchRequest {

    @NotBlank(message = "Branch name is required")
    private String name;

    @NotBlank(message = "Location is required")
    private String location;

    @Positive(message = "Manager ID must be a positive number")
    private Long managerId;
}
