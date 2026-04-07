package com.floatflow.repository;

import com.floatflow.entity.Expense;
import com.floatflow.entity.ExpenseStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    /**
     * Single-entity load used by submit / approve / reject / updateReceiptUrl.
     * Pre-loads submittedBy and branch so toResponse() never hits a detached proxy,
     * and avoids N+1 SELECT queries per mutation endpoint.
     */
    @Override
    @NonNull
    @EntityGraph(attributePaths = {"submittedBy", "branch"})
    Optional<Expense> findById(@NonNull Long id);


    @Query("SELECT e FROM Expense e JOIN FETCH e.submittedBy JOIN FETCH e.branch WHERE e.branch.id = :branchId ORDER BY e.createdAt DESC")
    List<Expense> findByBranchIdOrderByCreatedAtDesc(@Param("branchId") Long branchId);

    @Query("SELECT e FROM Expense e " +
           "JOIN FETCH e.submittedBy " +
           "JOIN FETCH e.branch " +
           "JOIN FETCH e.floatAllocation fa " +
           "WHERE e.submittedBy.id = :userId ORDER BY e.createdAt DESC")
    List<Expense> findBySubmittedByIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Query("SELECT e FROM Expense e JOIN FETCH e.submittedBy JOIN FETCH e.branch WHERE e.status = :status")
    List<Expense> findByStatus(@Param("status") ExpenseStatus status);

    @Query("SELECT e FROM Expense e JOIN FETCH e.submittedBy JOIN FETCH e.branch WHERE e.branch.id = :branchId AND e.status = :status ORDER BY e.createdAt DESC")
    List<Expense> findByBranchIdAndStatusOrderByCreatedAtDesc(@Param("branchId") Long branchId, @Param("status") ExpenseStatus status);

    @Override
    @Query("SELECT e FROM Expense e JOIN FETCH e.submittedBy JOIN FETCH e.branch")
    @org.springframework.lang.NonNull
    List<Expense> findAll();

    /**
     * Calculates total amount spent in a specific category by a branch today.
     * Used by the Policy Engine to enforce daily limits.
     *
     * JPQL (Java Persistence Query Language) is like SQL but uses entity/field names.
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.branch.id = :branchId " +
           "AND e.category = :category " +
           "AND e.status IN ('PENDING', 'APPROVED') " +
           "AND e.createdAt >= :startOfDay")
    BigDecimal sumByBranchAndCategoryAndDate(
        @Param("branchId") Long branchId,
        @Param("category") String category,
        @Param("startOfDay") LocalDateTime startOfDay
    );

    /**
     * Detects potential duplicate submissions (same amount, category, branch within 10 minutes).
     */
    @Query("SELECT COUNT(e) > 0 FROM Expense e " +
           "WHERE e.submittedBy.id = :userId " +
           "AND e.amount = :amount " +
           "AND e.category = :category " +
           "AND e.createdAt >= :since " +
           "AND e.status NOT IN ('WITHDRAWN', 'DRAFT')")
    boolean existsDuplicate(
        @Param("userId") Long userId,
        @Param("amount") BigDecimal amount,
        @Param("category") String category,
        @Param("since") LocalDateTime since
    );

    // For reporting
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.branch.id = :branchId AND e.status = 'APPROVED'")
    BigDecimal sumApprovedByBranch(@Param("branchId") Long branchId);

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.branch.id = :branchId AND e.status = :status")
    Long countByBranchAndStatus(@Param("branchId") Long branchId, @Param("status") ExpenseStatus status);
}
