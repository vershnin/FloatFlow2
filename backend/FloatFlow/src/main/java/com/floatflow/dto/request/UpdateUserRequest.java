package com.floatflow.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateUserRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Must be a valid email")
    @NotBlank(message = "Email is required")
    private String email;

    private Long branchId;
}
