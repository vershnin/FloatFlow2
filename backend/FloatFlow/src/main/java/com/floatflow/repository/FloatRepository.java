package com.floatflow.repository;

import com.floatflow.entity.Float;
import com.floatflow.entity.FloatStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FloatRepository extends JpaRepository<Float, Long> {

    @EntityGraph(attributePaths = {"branch", "createdBy"})
    List<Float> findByBranchId(Long branchId);

    Optional<Float> findByBranchIdAndStatus(Long branchId, FloatStatus status);

    @EntityGraph(attributePaths = {"branch", "createdBy"})
    List<Float> findByStatus(FloatStatus status);

    @Override
    @EntityGraph(attributePaths = {"branch", "createdBy"})
    List<Float> findAll();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM Float f WHERE f.id = :id")
    Optional<Float> findByIdForUpdate(Long id);
}
