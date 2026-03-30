package com.floatflow.controller;

import com.floatflow.dto.request.ChangeRoleRequest;
import com.floatflow.dto.request.RegisterRequest;
import com.floatflow.dto.request.ResetPasswordRequest;
import com.floatflow.dto.request.UpdateUserRequest;
import com.floatflow.dto.response.ApiResponse;
import com.floatflow.dto.response.UserResponse;
import com.floatflow.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", adminUserService.getAllUsers()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User retrieved", adminUserService.getUserById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User created", adminUserService.createUser(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User updated", adminUserService.updateUser(id, request)));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<UserResponse>> activateUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User activated", adminUserService.setUserActiveStatus(id, true)));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<UserResponse>> deactivateUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User deactivated", adminUserService.setUserActiveStatus(id, false)));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> changeRole(@PathVariable Long id, @Valid @RequestBody ChangeRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User role changed", adminUserService.changeUserRole(id, request)));
    }

    @PatchMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest request) {
        adminUserService.resetPassword(id, request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }
}
