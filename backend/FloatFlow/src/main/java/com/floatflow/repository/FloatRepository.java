package com.floatflow.repository;

import com.floatflow.entity.Float;
import com.floatflow.entity.FloatStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FloatRepository extends JpaRepository<Float, Long> {
    List<Float> findByBranchId(Long branchId);
    Optional<Float> findByBranchIdAndStatus(Long branchId, FloatStatus status);
    List<Float> findByStatus(FloatStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM Float f WHERE f.id = :id")
    Optional<Float> findByIdForUpdate(Long id);
}
