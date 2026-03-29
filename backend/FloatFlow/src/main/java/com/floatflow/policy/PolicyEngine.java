package com.floatflow.policy;

import com.floatflow.entity.Expense;
import com.floatflow.entity.Float;
import com.floatflow.entity.Policy;
import com.floatflow.exception.PolicyViolationException;
import com.floatflow.repository.ExpenseRepository;
import com.floatflow.repository.PolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Validates expense submissions against financial rules.
 * 
 * Checks for:
 * - Sufficient float balance
 * - Category limits (max amount & daily limit)
 * - Duplicate submissions
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PolicyEngine {

    private final PolicyRepository policyRepository;
    private final ExpenseRepository expenseRepository;

    /**
     * Checks all rules before saving an expense.
     */
    public void validate(Float floatAllocation, BigDecimal amount, String category,
                         Long branchId, Long userId) {
        log.debug("Validating expense: amount={}, category={}, branchId={}", amount, category, branchId);

        // Rule 1: Check float balance
        validateFloatBalance(floatAllocation, amount);

        // Rule 2 & 3: Check applicable policies
        List<Policy> policies = policyRepository.findApplicablePolicies(category, branchId);
        for (Policy policy : policies) {
            validateMaxAmount(policy, amount);
            validateDailyLimit(policy, amount, branchId);
        }

        // Rule 4: Duplicate detection
        validateNoDuplicate(userId, amount, category);
    }

    private void validateFloatBalance(Float floatAllocation, BigDecimal amount) {
        if (floatAllocation.getCurrentBalance().compareTo(amount) < 0) {
            throw new PolicyViolationException(
                String.format("PolicyViolation: Insufficient float balance. Available: %.2f, Requested: %.2f",
                    floatAllocation.getCurrentBalance(), amount)
            );
        }
    }

    private void validateMaxAmount(Policy policy, BigDecimal amount) {
        if (amount.compareTo(policy.getMaxAmount()) > 0) {
            throw new PolicyViolationException(
                String.format("PolicyViolation: Expense amount %.2f exceeds maximum allowed %.2f for category '%s'",
                    amount, policy.getMaxAmount(), policy.getCategory())
            );
        }
    }

    private void validateDailyLimit(Policy policy, BigDecimal newAmount, Long branchId) {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        BigDecimal todayTotal = expenseRepository.sumByBranchAndCategoryAndDate(
            branchId, policy.getCategory(), startOfDay
        );

        BigDecimal projectedTotal = todayTotal.add(newAmount);
        if (projectedTotal.compareTo(policy.getDailyLimit()) > 0) {
            throw new PolicyViolationException(
                String.format("PolicyViolation: This expense would exceed the daily limit of %.2f for category '%s'. " +
                    "Already spent today: %.2f",
                    policy.getDailyLimit(), policy.getCategory(), todayTotal)
            );
        }
    }

    private void validateNoDuplicate(Long userId, BigDecimal amount, String category) {
        // Check if the same user submitted the exact same amount and category in the last 10 minutes
        LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
        boolean isDuplicate = expenseRepository.existsDuplicate(userId, amount, category, tenMinutesAgo);

        if (isDuplicate) {
            throw new PolicyViolationException(
                "PolicyViolation: Duplicate expense detected. A similar expense was submitted within the last 10 minutes."
            );
        }
    }
}
