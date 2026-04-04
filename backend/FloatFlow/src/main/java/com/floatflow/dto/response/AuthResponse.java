package com.floatflow.dto.response;

import com.floatflow.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
/**
 * Returned after successful login or registration.
 * The frontend stores this token and sends it with every subsequent request.
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
    private boolean isActive;
    private LocalDateTime createdAt;
}
