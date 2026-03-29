package com.floatflow.service;

import com.floatflow.entity.Branch;
import com.floatflow.entity.Float;
import com.floatflow.entity.FloatStatus;
import com.floatflow.entity.Policy;
import com.floatflow.entity.User;
import com.floatflow.exception.PolicyViolationException;
import com.floatflow.policy.PolicyEngine;
import com.floatflow.repository.ExpenseRepository;
import com.floatflow.repository.PolicyRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the FloatFlow Policy Engine.
 *
 * Spring Boot 4 / JUnit 5.12 changes:
 * - @DisplayName on class and methods for readable test reports in IntelliJ.
 *   IntelliJ shows these names in the test runner instead of method names.
 * - @Nested test classes group related tests — better organisation in
 *   large test files; IntelliJ collapses them in the test tree.
 * - No changes to MockitoExtension or AssertJ — both are fully compatible.
 *
 * Run in IntelliJ:
 *   Right-click the class → Run 'PolicyEngineTest'
 *   Or click the green ▶ next to each @Test method to run individually.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PolicyEngine — Financial Rule Validation Tests")
class PolicyEngineTest {

    @Mock private PolicyRepository policyRepository;
    @Mock private ExpenseRepository expenseRepository;

    @InjectMocks
    private PolicyEngine policyEngine;

    private Float activeFloat;
    private Policy travelPolicy;
    private final Long branchId = 1L;
    private final Long userId = 5L;

    @BeforeEach
    void setUp() {
        Branch branch = Branch.builder()
            .id(branchId)
            .name("Nairobi Branch")
            .location("Nairobi")
            .build();

        activeFloat = Float.builder()
            .id(1L)
            .branch(branch)
            .initialAmount(new BigDecimal("50000"))
            .currentBalance(new BigDecimal("10000"))
            .status(FloatStatus.ACTIVE)
            .build();

        travelPolicy = Policy.builder()
            .id(1L)
            .name("Travel Policy")
            .category("TRAVEL")
            .maxAmount(new BigDecimal("5000"))
            .dailyLimit(new BigDecimal("15000"))
            .build();
    }

    // ── Float Balance Tests ───────────────────────────────────────────────────

    @Nested
    @DisplayName("Float Balance Validation")
    class FloatBalanceTests {

        @Test
        @DisplayName("Should pass when expense is within float balance")
        void validate_shouldPass_whenFloatHasSufficientBalance() {
            when(policyRepository.findApplicablePolicies("TRAVEL", branchId))
                .thenReturn(Collections.emptyList());
            when(expenseRepository.existsDuplicate(anyLong(), any(), anyString(), any()))
                .thenReturn(false);

            // 5,000 <= 10,000 available balance — must pass
            assertThatNoException().isThrownBy(() ->
                policyEngine.validate(activeFloat, new BigDecimal("5000"), "TRAVEL", branchId, userId)
            );
        }

        @Test
        @DisplayName("Should reject when expense exceeds float balance")
        void validate_shouldFail_whenFloatBalanceIsInsufficient() {
            // 15,000 > 10,000 balance — must be rejected
            assertThatThrownBy(() ->
                policyEngine.validate(activeFloat, new BigDecimal("15000"), "TRAVEL", branchId, userId)
            )
            .isInstanceOf(PolicyViolationException.class)
            .hasMessageContaining("Insufficient float balance");
        }
    }

    // ── Category Policy Tests ─────────────────────────────────────────────────

    @Nested
    @DisplayName("Category Policy Limit Validation")
    class CategoryPolicyTests {

        @Test
        @DisplayName("Should reject when expense exceeds category max amount")
        void validate_shouldFail_whenAmountExceedsPolicyMax() {
            when(policyRepository.findApplicablePolicies("TRAVEL", branchId))
                .thenReturn(List.of(travelPolicy));

            // 6,000 > 5,000 policy maxAmount — must be rejected
            assertThatThrownBy(() ->
                policyEngine.validate(activeFloat, new BigDecimal("6000"), "TRAVEL", branchId, userId)
            )
            .isInstanceOf(PolicyViolationException.class)
            .hasMessageContaining("exceeds maximum allowed");
        }

        @Test
        @DisplayName("Should reject when daily spending limit would be breached")
        void validate_shouldFail_whenDailyLimitWouldBeExceeded() {
            when(policyRepository.findApplicablePolicies("TRAVEL", branchId))
                .thenReturn(List.of(travelPolicy));

            // 12,000 already spent today + 5,000 new = 17,000 > 15,000 daily limit
            when(expenseRepository.sumByBranchAndCategoryAndDate(
                anyLong(), anyString(), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("12000"));

            assertThatThrownBy(() ->
                policyEngine.validate(activeFloat, new BigDecimal("5000"), "TRAVEL", branchId, userId)
            )
            .isInstanceOf(PolicyViolationException.class)
            .hasMessageContaining("daily limit");
        }
    }

    // ── Duplicate Detection Tests ─────────────────────────────────────────────

    @Nested
    @DisplayName("Duplicate Expense Detection")
    class DuplicateDetectionTests {

        @Test
        @DisplayName("Should reject duplicate expense within 10 minutes")
        void validate_shouldFail_whenDuplicateExpenseDetected() {
            when(policyRepository.findApplicablePolicies("TRAVEL", branchId))
                .thenReturn(Collections.emptyList());
            when(expenseRepository.existsDuplicate(anyLong(), any(), anyString(), any()))
                .thenReturn(true);  // Duplicate found

            assertThatThrownBy(() ->
                policyEngine.validate(activeFloat, new BigDecimal("1000"), "TRAVEL", branchId, userId)
            )
            .isInstanceOf(PolicyViolationException.class)
            .hasMessageContaining("Duplicate expense");
        }
    }
}
