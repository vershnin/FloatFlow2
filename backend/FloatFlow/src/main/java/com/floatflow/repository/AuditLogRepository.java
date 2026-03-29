package com.floatflow.repository;

import com.floatflow.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    // Pageable = supports ?page=0&size=20&sort=timestamp,desc in the URL
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    Page<AuditLog> findByUserIdOrderByTimestampDesc(Long userId, Pageable pageable);
    Page<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(
        String entityType, Long entityId, Pageable pageable);
}
