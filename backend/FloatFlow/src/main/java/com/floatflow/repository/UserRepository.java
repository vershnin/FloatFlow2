package com.floatflow.repository;

import com.floatflow.entity.User;
import com.floatflow.entity.Role;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA automatically generates SQL for common operations.
 * No need to write SELECT * FROM users WHERE email = ? — Spring does it!
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.branch")
    List<User> findAll();

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.branch WHERE u.id = :id")
    Optional<User> findById(Long id);

    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
    Optional<User> findByPasswordResetToken(String passwordResetToken);

    @EntityGraph(attributePaths = {"branch"})
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.branch.id = :branchId")
    List<User> findByRoleAndBranchId(Role role, Long branchId);
}
