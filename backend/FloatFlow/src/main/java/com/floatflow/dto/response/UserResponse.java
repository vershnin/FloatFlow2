package com.floatflow.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.floatflow.entity.Role;
import com.floatflow.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private Role role;

    @JsonProperty("isActive")
    private boolean active;

    private Long branchId;
    private String branchName;
    private LocalDateTime createdAt;

    public static UserResponse fromUser(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .active(user.isActive())
                .branchId(user.getBranch() != null ? user.getBranch().getId() : null)
                .branchName(user.getBranch() != null ? user.getBranch().getName() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}