package com.floatflow.controller;

import com.floatflow.dto.request.LoginRequest;
import com.floatflow.dto.request.RegisterRequest;
import com.floatflow.dto.response.ApiResponse;
import com.floatflow.dto.response.AuthResponse;
import com.floatflow.entity.Branch;
import com.floatflow.entity.Role;
import com.floatflow.entity.ExpenseStatus;
import com.floatflow.entity.FloatStatus;
import com.floatflow.service.AuthService;
import com.floatflow.service.BranchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Handles user registration and login.
 * These endpoints are PUBLIC — no JWT required (configured in SecurityConfig).
 *
 * @RestController = @Controller + @ResponseBody (returns JSON automatically)
 * @RequestMapping sets the base path for all endpoints in this class
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register and login endpoints")
public class AuthController {
    private final AuthService authService;
    private final BranchService branchService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
        @Valid @RequestBody RegisterRequest request
    ) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive a JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
        @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/roles")
    @Operation(summary = "Get all available user roles")
    public ResponseEntity<ApiResponse<List<Role>>> getRoles() {
        return ResponseEntity.ok(ApiResponse.success("Roles retrieved", Arrays.asList(Role.values())));
    }

    @GetMapping("/master-data")
    @Operation(summary = "Get all constant values used in the application")
    public ResponseEntity<ApiResponse<Map<String, List<?>>>> getMasterData() {
        Map<String, List<?>> data = new HashMap<>();
        data.put("roles", List.of(Role.values()));
        data.put("expenseStatuses", List.of(ExpenseStatus.values()));
        data.put("floatStatuses", List.of(FloatStatus.values()));
        data.put("branches", branchService.getAllBranches());
        return ResponseEntity.ok(ApiResponse.success("Master data retrieved", data));
    }
}
