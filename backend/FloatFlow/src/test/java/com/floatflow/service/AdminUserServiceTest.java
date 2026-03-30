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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminUserService — Admin User Management Tests")
class AdminUserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private BranchRepository branchRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuditService auditService;
    @Mock private SecurityContext securityContext;
    @Mock private Authentication authentication;

    @InjectMocks
    private AdminUserService adminUserService;

    private User adminUser;
    private User regularUser;
    private Branch testBranch;

    @BeforeEach
    void setUp() {
        testBranch = Branch.builder().id(1L).name("Test Branch").build();

        adminUser = User.builder()
                .id(1L)
                .name("Admin")
                .email("admin@test.com")
                .role(Role.ADMIN)
                .active(true)
                .build();

        regularUser = User.builder()
                .id(2L)
                .name("User")
                .email("user@test.com")
                .role(Role.EMPLOYEE)
                .active(true)
                .build();

        SecurityContextHolder.setContext(securityContext);
    }

    private void mockCurrentUser(User user) {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(user);
    }

    @Test
    @DisplayName("Should return all users")
    void getAllUsers_shouldReturnList() {
        when(userRepository.findAll()).thenReturn(List.of(adminUser, regularUser));

        List<UserResponse> result = adminUserService.getAllUsers();

        assertThat(result).hasSize(2);
        verify(userRepository).findAll();
    }

    @Test
    @DisplayName("Should create user successfully")
    void createUser_shouldSucceed() {
        mockCurrentUser(adminUser);
        RegisterRequest request = new RegisterRequest("New User", "new@test.com", "password", Role.FINANCE_OFFICER, 1L);
        
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(branchRepository.findById(1L)).thenReturn(Optional.of(testBranch));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            if (u.getId() == null) {
                u.setId(3L); // Simulate generated ID
            }
            return u;
        });

        UserResponse result = adminUserService.createUser(request);

        assertThat(result.getEmail()).isEqualTo("new@test.com");
        verify(auditService).log(eq(adminUser.getId()), eq(AuditService.ADMIN_USER_CREATED), anyString(), eq(3L), anyString());
    }

    @Test
    @DisplayName("Should update user successfully")
    void updateUser_shouldSucceed() {
        mockCurrentUser(adminUser);
        UpdateUserRequest request = new UpdateUserRequest();
        request.setName("Updated Name");
        request.setEmail("user@test.com");

        when(userRepository.findById(2L)).thenReturn(Optional.of(regularUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        UserResponse result = adminUserService.updateUser(2L, request);

        assertThat(result.getName()).isEqualTo("Updated Name");
        verify(auditService).log(eq(adminUser.getId()), eq(AuditService.ADMIN_USER_UPDATED), anyString(), eq(2L), anyString());
    }

    @Test
    @DisplayName("Should deactivate user successfully")
    void deactivateUser_shouldSucceed() {
        mockCurrentUser(adminUser);
        when(userRepository.findById(2L)).thenReturn(Optional.of(regularUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        UserResponse result = adminUserService.setUserActiveStatus(2L, false);

        assertThat(result.isActive()).isFalse();
        verify(auditService).log(eq(adminUser.getId()), eq(AuditService.ADMIN_USER_DEACTIVATED), anyString(), eq(2L), anyString());
    }

    @Test
    @DisplayName("Should prevent deactivating the last admin")
    void deactivateLastAdmin_shouldFail() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(userRepository.findAll()).thenReturn(List.of(adminUser)); // Only one active admin

        assertThatThrownBy(() -> adminUserService.setUserActiveStatus(1L, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Cannot deactivate or demote the last active admin");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should change role successfully")
    void changeRole_shouldSucceed() {
        mockCurrentUser(adminUser);
        ChangeRoleRequest request = new ChangeRoleRequest();
        request.setRole(Role.FINANCE_OFFICER);

        when(userRepository.findById(2L)).thenReturn(Optional.of(regularUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        UserResponse result = adminUserService.changeUserRole(2L, request);

        assertThat(result.getRole()).isEqualTo(Role.FINANCE_OFFICER);
        verify(auditService).log(eq(adminUser.getId()), eq(AuditService.ADMIN_ROLE_CHANGED), anyString(), eq(2L), anyString());
    }

    @Test
    @DisplayName("Should prevent demoting the last admin")
    void demoteLastAdmin_shouldFail() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(userRepository.findAll()).thenReturn(List.of(adminUser));

        ChangeRoleRequest request = new ChangeRoleRequest();
        request.setRole(Role.EMPLOYEE);

        assertThatThrownBy(() -> adminUserService.changeUserRole(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Cannot deactivate or demote the last active admin");
    }

    @Test
    @DisplayName("Should reset password successfully")
    void resetPassword_shouldSucceed() {
        mockCurrentUser(adminUser);
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setNewPassword("new_secure_password");

        when(userRepository.findById(2L)).thenReturn(Optional.of(regularUser));
        when(passwordEncoder.encode(anyString())).thenReturn("new_hashed_password");

        adminUserService.resetPassword(2L, request);

        verify(userRepository).save(regularUser);
        verify(auditService).log(eq(adminUser.getId()), eq(AuditService.ADMIN_PASSWORD_RESET), anyString(), eq(2L), anyString());
    }
}
