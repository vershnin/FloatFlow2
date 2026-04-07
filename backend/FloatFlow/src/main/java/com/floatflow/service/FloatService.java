package com.floatflow.service;

import com.floatflow.audit.AuditService;
import com.floatflow.dto.request.CreateFloatRequest;
import com.floatflow.dto.request.TopUpFloatRequest;
import com.floatflow.dto.response.FloatResponse;
import com.floatflow.entity.Branch;
import com.floatflow.entity.FloatStatus;
import com.floatflow.entity.FloatTransaction;
import com.floatflow.entity.User;
import com.floatflow.exception.BadRequestException;
import com.floatflow.exception.ResourceNotFoundException;
import com.floatflow.repository.BranchRepository;
import com.floatflow.repository.FloatRepository;
import com.floatflow.repository.FloatTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FloatService {

    private final FloatRepository floatRepository;
    private final FloatTransactionRepository floatTransactionRepository;
    private final BranchRepository branchRepository;
    private final AuditService auditService;

    @Transactional
    public FloatResponse createFloat(CreateFloatRequest request, User createdBy) {
        Branch branch = branchRepository.findById(request.getBranchId())
            .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + request.getBranchId()));

        // Optional: prevent multiple active floats per branch
        floatRepository.findByBranchIdAndStatus(branch.getId(), FloatStatus.ACTIVE)
            .ifPresent(existing -> {
                throw new BadRequestException("Branch already has an active float. Please close it first.");
            });

        com.floatflow.entity.Float floatAllocation = com.floatflow.entity.Float.builder()
            .branch(branch)
            .initialAmount(request.getInitialAmount())
            .currentBalance(request.getInitialAmount())
            .createdBy(createdBy)
            .build();

        floatAllocation = floatRepository.save(floatAllocation);

        // Record the initial allocation as a transaction
        saveTransaction(floatAllocation, "INITIAL_ALLOCATION", request.getInitialAmount(), "Float created");

        auditService.log(createdBy.getId(), AuditService.FLOAT_CREATED, "Float",
            floatAllocation.getId(), "Amount: " + request.getInitialAmount());

        log.info("Float created for branch {} with amount {}", branch.getName(), request.getInitialAmount());
        return toResponse(floatAllocation);
    }

    @Transactional
    public FloatResponse topUp(Long floatId, TopUpFloatRequest request, User user) {
        com.floatflow.entity.Float floatAllocation = floatRepository.findByIdForUpdate(floatId)
            .orElseThrow(() -> new ResourceNotFoundException("Float not found with ID: " + floatId));

        assertBranchManagerScope(user, floatAllocation.getBranch().getId());

        if (floatAllocation.getStatus() == FloatStatus.CLOSED) {
            throw new BadRequestException("Cannot top up a closed float.");
        }

        floatAllocation.setCurrentBalance(floatAllocation.getCurrentBalance().add(request.getAmount()));

        // If float was exhausted, reactivate it
        if (floatAllocation.getStatus() == FloatStatus.EXHAUSTED) {
            floatAllocation.setStatus(FloatStatus.ACTIVE);
        }

        floatRepository.save(floatAllocation);
        saveTransaction(floatAllocation, "TOPUP", request.getAmount(), request.getReference());

        auditService.log(user.getId(), AuditService.FLOAT_TOPUP, "Float", floatId,
            "TopUp: " + request.getAmount());

        return toResponse(floatAllocation);
    }

    @Transactional
    public FloatResponse closeFloat(Long floatId, User user) {
        com.floatflow.entity.Float floatAllocation = floatRepository.findByIdForUpdate(floatId)
            .orElseThrow(() -> new ResourceNotFoundException("Float not found with ID: " + floatId));

        if (floatAllocation.getStatus() == FloatStatus.CLOSED) {
            throw new BadRequestException("Float is already closed.");
        }

        floatAllocation.setStatus(FloatStatus.CLOSED);
        floatRepository.save(floatAllocation);

        saveTransaction(floatAllocation, "CLOSED", BigDecimal.ZERO, "Float closed");

        auditService.log(user.getId(), AuditService.FLOAT_CLOSED, "Float", floatId, "Float closed");

        return toResponse(floatAllocation);
    }

    public List<FloatResponse> getAllFloats(User user) {
        if (user.getRole() == com.floatflow.entity.Role.BRANCH_MANAGER) {
            if (user.getBranch() == null) {
                throw new BadRequestException("Branch manager is not assigned to any branch");
            }
            return floatRepository.findByBranchId(user.getBranch().getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        }

        return floatRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public List<FloatTransaction> getTransactions(Long floatId, User user) {
        com.floatflow.entity.Float floatAllocation = floatRepository.findById(floatId)
            .orElseThrow(() -> new ResourceNotFoundException("Float not found with ID: " + floatId));

        assertBranchManagerScope(user, floatAllocation.getBranch().getId());
        return floatTransactionRepository.findByFloatAllocationIdOrderByCreatedAtDesc(floatId);
    }

    public List<FloatResponse> getFloatsByBranch(Long branchId) {
        return floatRepository.findByBranchId(branchId).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public FloatResponse getActiveFloatForMyBranch(User user) {
        if (user.getBranch() == null) {
            throw new BadRequestException("User is not assigned to any branch");
        }

        com.floatflow.entity.Float activeFloat = floatRepository
            .findByBranchIdAndStatus(user.getBranch().getId(), FloatStatus.ACTIVE)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Active float not found for branch: " + user.getBranch().getId()));

        return toResponse(activeFloat);
    }

    public com.floatflow.entity.Float findActiveFloat(Long floatId) {
        return floatRepository.findById(floatId)
            .filter(f -> f.getStatus() == FloatStatus.ACTIVE)
            .orElseThrow(() -> new ResourceNotFoundException("Active float not found with ID: " + floatId));
    }

    /**
     * Subtract an approved expense from the float.
     */
    @Transactional
    public void deductFromFloat(com.floatflow.entity.Float floatAllocation, BigDecimal amount, Long expenseId) {
        // Reload with pessimistic lock to ensure transaction safety
        com.floatflow.entity.Float lockedFloat = floatRepository.findByIdForUpdate(floatAllocation.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Float not found: " + floatAllocation.getId()));

        if (lockedFloat.getStatus() != FloatStatus.ACTIVE) {
            throw new BadRequestException("Cannot deduct from a float that is not ACTIVE. Current status: " + lockedFloat.getStatus());
        }

        if (lockedFloat.getCurrentBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Insufficient float balance. Available: " + lockedFloat.getCurrentBalance());
        }

        lockedFloat.setCurrentBalance(lockedFloat.getCurrentBalance().subtract(amount));

        // Auto-exhaust if balance hits zero
        if (lockedFloat.getCurrentBalance().compareTo(BigDecimal.ZERO) <= 0) {
            lockedFloat.setStatus(FloatStatus.EXHAUSTED);
        }

        floatRepository.save(lockedFloat);
        saveTransaction(lockedFloat, "EXPENSE_DEDUCTION", amount, "Expense #" + expenseId);
    }

    private void saveTransaction(com.floatflow.entity.Float floatAllocation, String type,
                                  BigDecimal amount, String reference) {
        FloatTransaction tx = FloatTransaction.builder()
            .floatAllocation(floatAllocation)
            .type(type)
            .amount(amount)
            .reference(reference)
            .build();
        floatTransactionRepository.save(tx);
    }

    private FloatResponse toResponse(com.floatflow.entity.Float f) {
        double percentage = f.getInitialAmount().compareTo(BigDecimal.ZERO) > 0
            ? f.getCurrentBalance().divide(f.getInitialAmount(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).doubleValue()
            : 0;

        return FloatResponse.builder()
            .id(f.getId())
            .branchId(f.getBranch().getId())
            .branchName(f.getBranch().getName())
            .initialAmount(f.getInitialAmount())
            .currentBalance(f.getCurrentBalance())
            .status(f.getStatus())
            .createdByName(f.getCreatedBy().getName())
            .createdAt(f.getCreatedAt())
            .balancePercentage(percentage)
            .build();
    }

    private void assertBranchManagerScope(User user, Long branchId) {
        if (user.getRole() != com.floatflow.entity.Role.BRANCH_MANAGER) {
            return;
        }
        if (user.getBranch() == null || !user.getBranch().getId().equals(branchId)) {
            throw new AccessDeniedException("Branch managers can only access data for their own branch");
        }
    }
}
