package com.floatflow.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.floatflow.entity.Branch;
import com.floatflow.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BranchResponse {
    private Long id;
    private String name;
    private String location;
    private String managerName;
    private String managerEmail;

    @JsonProperty("isActive")
    private boolean active;

    private LocalDateTime createdAt;

    public static BranchResponse fromBranch(Branch branch) {
        User manager = branch.getManager();
        return BranchResponse.builder()
            .id(branch.getId())
            .name(branch.getName())
            .location(branch.getLocation())
            .managerName(manager != null ? manager.getName() : null)
            .managerEmail(manager != null ? manager.getEmail() : null)
            .active(branch.isActive())
            .createdAt(branch.getCreatedAt())
            .build();
    }
}

