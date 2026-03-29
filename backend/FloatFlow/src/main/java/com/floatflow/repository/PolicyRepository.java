package com.floatflow.repository;

import com.floatflow.entity.Policy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PolicyRepository extends JpaRepository<Policy, Long> {

    /**
     * Finds policies that apply to a given branch and category.
     * Returns both global policies (branch = null) and branch-specific ones.
     */
    @Query("SELECT p FROM Policy p WHERE p.isActive = true AND p.category = :category " +
           "AND (p.branch IS NULL OR p.branch.id = :branchId)")
    List<Policy> findApplicablePolicies(
        @Param("category") String category,
        @Param("branchId") Long branchId
    );

    List<Policy> findByIsActiveTrue();
}
