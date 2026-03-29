package com.floatflow.repository;

import com.floatflow.entity.Float;
import com.floatflow.entity.FloatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FloatRepository extends JpaRepository<Float, Long> {
    List<Float> findByBranchId(Long branchId);
    Optional<Float> findByBranchIdAndStatus(Long branchId, FloatStatus status);
    List<Float> findByStatus(FloatStatus status);
}
