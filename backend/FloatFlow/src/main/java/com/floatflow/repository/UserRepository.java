package com.floatflow.repository;

import com.floatflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA automatically generates SQL for common operations.
 * No need to write SELECT * FROM users WHERE email = ? — Spring does it!
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
