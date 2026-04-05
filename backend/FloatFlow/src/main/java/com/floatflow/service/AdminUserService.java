package com.floatflow.service;

import com.floatflow.audit.AuditService;
import com.floatflow.dto.request.ChangeRoleRequest;
import com.floatflow.dto.request.RegisterRequest;
import com.floatflow.dto.request.ResetPasswordRequest;
import com.floatflow.dto.request.UpdateUserRequest;
import com.floatflow.dto.response.UserResponse;
import com.floatflow.entity.Branch;
import com.floatflow.entity.Role;
import com.floatflow.entity.User;
import com.floatflow.exception.BadRequestException;
import com.floatflow.exception.ResourceNotFoundException;
import com.floatflow.repository.BranchRepository;
import com.floatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return userRepository.findById(id)
                .map(UserResponse::fromUser)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Transactional
    public UserResponse createUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .branch(branch)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        
        logAudit(AuditService.ADMIN_USER_CREATED, savedUser.getId(), 
                String.format("Created user: %s with role %s", savedUser.getEmail(), savedUser.getRole()));

        return UserResponse.fromUser(savedUser);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        String before = String.format("Name: %s, Email: %s, Branch: %s", 
                user.getName(), user.getEmail(), user.getBranch() != null ? user.getBranch().getId() : "null");

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
            user.setBranch(branch);
        } else {
            user.setBranch(null);
        }

        User updatedUser = userRepository.save(user);

        String after = String.format("Name: %s, Email: %s, Branch: %s", 
                updatedUser.getName(), updatedUser.getEmail(), updatedUser.getBranch() != null ? updatedUser.getBranch().getId() : "null");

        logAudit(AuditService.ADMIN_USER_UPDATED, updatedUser.getId(), 
                String.format("Updated user details. Before: [%s], After: [%s]", before, after));

        return UserResponse.fromUser(updatedUser);
    }

    @Transactional
    public UserResponse setUserActiveStatus(Long id, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.isActive() == active) {
            return UserResponse.fromUser(user);
        }

        if (!active && user.getRole() == Role.ADMIN) {
            validateLastAdmin(id);
        }

        user.setActive(active);
        User updatedUser = userRepository.save(user);

        String action = active ? AuditService.ADMIN_USER_ACTIVATED : AuditService.ADMIN_USER_DEACTIVATED;
        logAudit(action, updatedUser.getId(), "Set active status to " + active);

        return UserResponse.fromUser(updatedUser);
    }

    @Transactional
    public UserResponse changeUserRole(Long id, ChangeRoleRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Role oldRole = user.getRole();
        Role newRole = request.getRole();

        if (oldRole == newRole) {
            return UserResponse.fromUser(user);
        }

        // Prevent de-admining the last admin
        if (oldRole == Role.ADMIN && newRole != Role.ADMIN) {
            validateLastAdmin(id);
        }

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);

        logAudit(AuditService.ADMIN_ROLE_CHANGED, updatedUser.getId(), 
                String.format("Changed role from %s to %s", oldRole, newRole));

        return UserResponse.fromUser(updatedUser);
    }

    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        logAudit(AuditService.ADMIN_PASSWORD_RESET, user.getId(), "Password reset by admin");
    }

    private void validateLastAdmin(Long adminId) {
        long adminCount = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN && u.isActive())
                .count();

        if (adminCount <= 1) {
            // Check if the one admin is the one being modified
            User admin = userRepository.findById(adminId).orElseThrow();
            if (admin.getRole() == Role.ADMIN && admin.isActive()) {
                 throw new BadRequestException("Cannot deactivate or demote the last active admin");
            }
        }
    }

    private void logAudit(String action, Long targetUserId, String details) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long currentUserId = null;
        if (principal instanceof User user) {
            currentUserId = user.getId();
        }
        auditService.log(currentUserId, action, "User", targetUserId, details);
    }
}
