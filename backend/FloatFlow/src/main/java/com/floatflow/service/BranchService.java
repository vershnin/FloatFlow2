package com.floatflow.service;

import com.floatflow.dto.request.CreateBranchRequest;
import com.floatflow.dto.response.BranchResponse;
import com.floatflow.entity.Branch;
import com.floatflow.entity.Role;
import com.floatflow.entity.User;
import com.floatflow.exception.BadRequestException;
import com.floatflow.exception.ConflictException;
import com.floatflow.exception.ResourceNotFoundException;
import com.floatflow.repository.BranchRepository;
import com.floatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BranchService {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    public Branch getBranchById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + id));
    }

    @Transactional
    public BranchResponse createBranch(CreateBranchRequest request) {
        String normalizedName = normalizeRequired(request.getName(), "Branch name is required");
        String normalizedLocation = normalizeRequired(request.getLocation(), "Location is required");

        if (branchRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new ConflictException("Branch name already exists: " + normalizedName);
        }

        User manager = resolveManager(request.getManagerId(), null);

        Branch branch = Branch.builder()
                .name(normalizedName)
                .location(normalizedLocation)
                .manager(manager)
                .build();

        try {
            Branch savedBranch = branchRepository.save(branch);
            syncManagerBranchLink(null, manager, savedBranch);
            log.info("Created new branch: {} with ID: {}", savedBranch.getName(), savedBranch.getId());
            return BranchResponse.fromBranch(savedBranch);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("Branch name already exists: " + normalizedName);
        }
    }

    @Transactional
    public BranchResponse updateBranch(Long id, CreateBranchRequest request) {
        Branch branch = getBranchById(id);
        String normalizedName = normalizeRequired(request.getName(), "Branch name is required");
        String normalizedLocation = normalizeRequired(request.getLocation(), "Location is required");

        if (branchRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new ConflictException("Branch name already exists: " + normalizedName);
        }

        User previousManager = branch.getManager();
        User manager = resolveManager(request.getManagerId(), id);

        branch.setName(normalizedName);
        branch.setLocation(normalizedLocation);
        branch.setManager(manager);

        try {
            Branch saved = branchRepository.save(branch);
            syncManagerBranchLink(previousManager, manager, saved);
            return BranchResponse.fromBranch(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("Branch name already exists: " + normalizedName);
        }
    }

    @Transactional
    public BranchResponse activateBranch(Long branchId) {
        return setBranchActive(branchId, true);
    }

    @Transactional
    public BranchResponse deactivateBranch(Long branchId) {
        return setBranchActive(branchId, false);
    }

    private BranchResponse setBranchActive(Long branchId, boolean active) {
        Branch branch = getBranchById(branchId);
        branch.setActive(active);
        log.info("{} branch with ID: {}", active ? "Activated" : "Deactivated", branchId);
        return BranchResponse.fromBranch(branchRepository.save(branch));
    }

    private User resolveManager(Long managerId, Long currentBranchId) {
        if (managerId == null) {
            return null;
        }

        User manager = userRepository.findById(managerId)
            .orElseThrow(() -> new BadRequestException("Invalid managerId: " + managerId));

        if (manager.getRole() != Role.BRANCH_MANAGER) {
            throw new BadRequestException("Selected manager must have BRANCH_MANAGER role");
        }
        if (!manager.isActive()) {
            throw new BadRequestException("Selected manager is inactive");
        }
        if ((currentBranchId == null && branchRepository.existsByManagerId(managerId))
            || (currentBranchId != null && branchRepository.existsByManagerIdAndIdNot(managerId, currentBranchId))) {
            throw new ConflictException("Manager is already assigned to another branch");
        }
        if (manager.getBranch() != null
            && !manager.getBranch().getId().equals(currentBranchId)) {
            throw new ConflictException("Manager already belongs to another branch");
        }

        return manager;
    }

    private void syncManagerBranchLink(User previousManager, User newManager, Branch branch) {
        if (previousManager != null && (newManager == null || !previousManager.getId().equals(newManager.getId()))) {
            if (previousManager.getBranch() != null && previousManager.getBranch().getId().equals(branch.getId())) {
                previousManager.setBranch(null);
                userRepository.save(previousManager);
            }
        }

        if (newManager != null) {
            newManager.setBranch(branch);
            userRepository.save(newManager);
        }
    }

    private String normalizeRequired(String value, String message) {
        String normalized = value == null ? null : value.trim();
        if (normalized == null || normalized.isEmpty()) {
            throw new BadRequestException(message);
        }
        return normalized;
    }

    @Transactional
    public void deleteBranch(Long id) {
        Branch branch = getBranchById(id);
        User manager = branch.getManager();
        if (manager != null && manager.getBranch() != null && manager.getBranch().getId().equals(id)) {
            manager.setBranch(null);
            userRepository.save(manager);
        }
        branchRepository.delete(branch);
        log.info("Deleted branch with ID: {}", id);
    }
}
