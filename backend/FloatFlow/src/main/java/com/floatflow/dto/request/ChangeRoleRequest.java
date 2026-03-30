package com.floatflow.dto.request;

import com.floatflow.entity.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangeRoleRequest {
    @NotNull(message = "New role is required")
    private Role role;
}
