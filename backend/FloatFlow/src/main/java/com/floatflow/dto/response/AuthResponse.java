package com.floatflow.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.floatflow.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Returned after successful login or registration.
 */
@Data
@Builder
public class AuthResponse {
    private String token;
    private String email;
    private String name;
    private Role role;
    private Long userId;
    private Long branchId;

    @JsonProperty("isActive")
    private boolean isActive;

    private LocalDateTime createdAt;
}