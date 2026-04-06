package com.floatflow.service;

import com.floatflow.dto.request.CreateBranchRequest;
import com.floatflow.dto.response.BranchResponse;
import com.floatflow.entity.Branch;
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

        User manager = resolveManager(request.getManagerId());

        Branch branch = Branch.builder()
                .name(normalizedName)
                .location(normalizedLocation)
                .manager(manager)
                .build();

        try {
            Branch savedBranch = branchRepository.save(branch);
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

        User manager = resolveManager(request.getManagerId());

        branch.setName(normalizedName);
        branch.setLocation(normalizedLocation);
        branch.setManager(manager);

        try {
            return BranchResponse.fromBranch(branchRepository.save(branch));
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("Branch name already exists: " + normalizedName);
        }
    }

    private User resolveManager(Long managerId) {
        if (managerId == null) {
            return null;
        }
        return userRepository.findById(managerId)
            .orElseThrow(() -> new BadRequestException("Invalid managerId: " + managerId));
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
        branchRepository.delete(branch);
        log.info("Deleted branch with ID: {}", id);
    }
}
