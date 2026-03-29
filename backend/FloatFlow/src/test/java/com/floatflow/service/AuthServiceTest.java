package com.floatflow.service;

import com.floatflow.audit.AuditService;
import com.floatflow.dto.request.LoginRequest;
import com.floatflow.dto.request.RegisterRequest;
import com.floatflow.dto.response.AuthResponse;
import com.floatflow.entity.Branch;
import com.floatflow.entity.Role;
import com.floatflow.entity.User;
import com.floatflow.exception.BadRequestException;
import com.floatflow.repository.BranchRepository;
import com.floatflow.repository.UserRepository;
import com.floatflow.security.JwtService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthService.
 *
 * Fixes applied vs original:
 *   1. AuditService @Mock added — AuthService requires it via @RequiredArgsConstructor
 *   2. RegisterRequest uses setters — @Data only, no @Builder in original
 *   3. LoginRequest uses setters  — @Data only, no @Builder in original
 *   4. response.getRole() compared to Role enum, not Role.name() String
 *   5. Wildcard Assertions.* replaced with explicit imports to avoid ambiguity
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService — Registration and Login Tests")
class AuthServiceTest {

    @Mock private UserRepository        userRepository;
    @Mock private BranchRepository      branchRepository;
    @Mock private PasswordEncoder       passwordEncoder;
    @Mock private JwtService            jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private AuditService          auditService;   // FIX 1

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest    loginRequest;
    private Branch          testBranch;

    @BeforeEach
    void setUp() {
        testBranch = new Branch();
        testBranch.setId(1L);
        testBranch.setName("Headquarters");
        testBranch.setLocation("Nairobi");

        // FIX 2 — RegisterRequest has @Builder now, but keeping setters for safety
        registerRequest = new RegisterRequest();
        registerRequest.setName("Richard Gak");
        registerRequest.setEmail("richard@floatflow.co.ke");
        registerRequest.setPassword("SecurePassword25!");
        registerRequest.setRole(Role.EMPLOYEE);
        registerRequest.setBranchId(1L);

        // FIX 3 — LoginRequest has @Builder now, but keeping setters for safety
        loginRequest = new LoginRequest();
        loginRequest.setEmail("richard@floatflow.co.ke");
        loginRequest.setPassword("SecurePassword25!");
    }

    @Nested
    @DisplayName("User Registration")
    class RegistrationTests {

        @Test
        @DisplayName("Should register a new user and return a JWT token")
        void register_shouldSucceed_withValidRequest() {
            when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
            when(branchRepository.findById(1L)).thenReturn(Optional.of(testBranch));
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$hashed");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(jwtService.generateToken(any(User.class))).thenReturn("jwt.token.value");
            doNothing().when(auditService).log(any(), eq(AuditService.USER_REGISTERED),
                eq("User"), any(), any());

            AuthResponse response = authService.register(registerRequest);

            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("jwt.token.value");
            assertThat(response.getName()).isEqualTo("Richard Gak");
            assertThat(response.getEmail()).isEqualTo("richard@floatflow.co.ke");

            verify(passwordEncoder).encode("SecurePassword25!");
            verify(userRepository).save(any(User.class));
            verify(auditService).log(any(), eq(AuditService.USER_REGISTERED),
                eq("User"), any(), any());
        }

        @Test
        @DisplayName("Should reject registration when email already exists")
        void register_shouldFail_whenEmailAlreadyRegistered() {
            when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

            assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already registered");

            verify(userRepository, never()).save(any(User.class));
            verify(auditService, never()).log(any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Should reject registration when branch does not exist")
        void register_shouldFail_whenBranchNotFound() {
            when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
            when(branchRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(RuntimeException.class);

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("User Login")
    class LoginTests {

        @Test
        @DisplayName("Should return JWT token on successful login")
        void login_shouldSucceed_withCorrectCredentials() {
            User user = User.builder()
                .id(1L)
                .name("Richard Gak")
                .email("richard@floatflow.co.ke")
                .password("$2a$12$hashed")
                .role(Role.EMPLOYEE)
                .branch(testBranch)
                .active(true)
                .build();

            when(userRepository.findByEmail(loginRequest.getEmail()))
                .thenReturn(Optional.of(user));
            when(jwtService.generateToken(user)).thenReturn("login.jwt.token");
            doNothing().when(auditService).log(any(), eq(AuditService.USER_LOGIN),
                eq("User"), any(), isNull());

            AuthResponse response = authService.login(loginRequest);

            assertThat(response.getToken()).isEqualTo("login.jwt.token");
            assertThat(response.getRole()).isEqualTo(Role.EMPLOYEE); // FIX 4
            verify(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));
            verify(auditService).log(any(), eq(AuditService.USER_LOGIN),
                eq("User"), any(), isNull());
        }

        @Test
        @DisplayName("Should throw BadCredentialsException for wrong password")
        void login_shouldFail_whenPasswordIsIncorrect() {
            doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

            assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class);

            verify(auditService, never()).log(any(), any(), any(), any(), any());
        }
    }
}
