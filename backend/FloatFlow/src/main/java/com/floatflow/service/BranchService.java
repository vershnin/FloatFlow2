package com.floatflow.service;

import com.floatflow.dto.request.CreateBranchRequest;
import com.floatflow.entity.Branch;
import com.floatflow.exception.ResourceNotFoundException;
import com.floatflow.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BranchService {

    private final BranchRepository branchRepository;

    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    public Branch getBranchById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + id));
    }

    @Transactional
    public Branch createBranch(CreateBranchRequest request) {
        if (branchRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Branch name already exists: " + request.getName());
        }

        Branch branch = Branch.builder()
                .name(request.getName())
                .location(request.getLocation())
                .build();

        Branch savedBranch = branchRepository.save(branch);
        log.info("Created new branch: {} with ID: {}", savedBranch.getName(), savedBranch.getId());
        return savedBranch;
    }

    @Transactional
    public Branch updateBranch(Long id, CreateBranchRequest request) {
        Branch branch = getBranchById(id);

        if (!branch.getName().equals(request.getName()) && branchRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Branch name already exists: " + request.getName());
        }

        branch.setName(request.getName());
        branch.setLocation(request.getLocation());

        return branchRepository.save(branch);
    }

    @Transactional
    public void deleteBranch(Long id) {
        Branch branch = getBranchById(id);
        branchRepository.delete(branch);
        log.info("Deleted branch with ID: {}", id);
    }
}
