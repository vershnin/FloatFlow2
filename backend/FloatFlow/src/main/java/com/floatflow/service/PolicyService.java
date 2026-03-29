package com.floatflow.service;

import com.floatflow.audit.AuditService;
import com.floatflow.dto.request.CreatePolicyRequest;
import com.floatflow.entity.Branch;
import com.floatflow.entity.Policy;
import com.floatflow.entity.User;
import com.floatflow.exception.ResourceNotFoundException;
import com.floatflow.repository.BranchRepository;
import com.floatflow.repository.PolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final BranchRepository branchRepository;
    private final AuditService auditService;

    @Transactional
    public Policy createPolicy(CreatePolicyRequest request, User createdBy) {
        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + request.getBranchId()));
        }

        Policy policy = Policy.builder()
            .name(request.getName())
            .category(request.getCategory())
            .maxAmount(request.getMaxAmount())
            .dailyLimit(request.getDailyLimit())
            .branch(branch)
            .build();

        policy = policyRepository.save(policy);
        auditService.log(createdBy.getId(), AuditService.POLICY_CREATED, "Policy", policy.getId(),
            "Category: " + request.getCategory() + ", MaxAmount: " + request.getMaxAmount());

        return policy;
    }

    @Transactional
    public Policy updatePolicy(Long id, CreatePolicyRequest request, User updatedBy) {
        Policy policy = policyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Policy not found: " + id));

        policy.setName(request.getName());
        policy.setCategory(request.getCategory());
        policy.setMaxAmount(request.getMaxAmount());
        policy.setDailyLimit(request.getDailyLimit());

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
            policy.setBranch(branch);
        }

        policy = policyRepository.save(policy);
        auditService.log(updatedBy.getId(), AuditService.POLICY_UPDATED, "Policy", id, null);
        return policy;
    }

    @Transactional
    public void deletePolicy(Long id, User deletedBy) {
        Policy policy = policyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Policy not found: " + id));
        policy.setActive(false);  // Soft delete — never hard delete financial records
        policyRepository.save(policy);
        auditService.log(deletedBy.getId(), AuditService.POLICY_DELETED, "Policy", id, null);
    }

    public List<Policy> getAllPolicies() {
        return policyRepository.findByIsActiveTrue();
    }
}
