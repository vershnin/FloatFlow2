package com.floatflow.repository;

import com.floatflow.entity.FloatTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FloatTransactionRepository extends JpaRepository<FloatTransaction, Long> {
    List<FloatTransaction> findByFloatAllocationIdOrderByCreatedAtDesc(Long floatId);
}
