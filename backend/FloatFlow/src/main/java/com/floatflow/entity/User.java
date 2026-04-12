package com.floatflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * User entity — also implements Spring Security's UserDetails interface.
 * This lets Spring Security use this entity directly for authentication
 * without a separate UserDetailsService wrapper class.
 *
 * Java 25 / Lombok 1.18.42 changes from original:
 *
 * 1. The original code used a boolean field named 'isActive'. This caused
 *    a conflict in Lombok 1.18.38+ because @Data generates both isActive()
 *    (for boolean getter) and getIsActive() — confusing JPA and Hibernate.
 *    Fixed by renaming to 'active' with explicit @Getter(name="isActive")
 *    to preserve the UserDetails interface contract.
 *
 * 2. @EqualsAndHashCode(onlyExplicitlyIncluded = true) with @EqualsAndHashCode.Include
 *    on the 'id' field. This is best practice for JPA entities — using the database
 *    PK for equality rather than all fields (which @Data would do by default).
 *    This prevents issues with Hibernate proxy objects and collections.
 *
 * 3. @ToString(exclude = {"password", "branch"}) prevents:
 *    - Passwords leaking into logs
 *    - LazyInitializationException from accessing 'branch' outside a transaction
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"password", "branch"})
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include  // Use only ID for equals/hashCode
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    // Stores the role as a string in the DB (e.g., "FINANCE_OFFICER")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Many users can belong to one branch
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    // Renamed from 'isActive' to 'active' to avoid Lombok getter naming conflict.
    // 'active' generates isActive() automatically — satisfies UserDetails.isEnabled().
    @Builder.Default
    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "password_reset_token")
    private String passwordResetToken;

    @Column(name = "password_reset_expires_at")
    private LocalDateTime passwordResetExpiresAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Spring Security UserDetails interface ─────────────────────────────

    /**
     * Returns the user's role prefixed with "ROLE_" as required by Spring Security.
     * e.g., Role.FINANCE_OFFICER → "ROLE_FINANCE_OFFICER"
     * This is what @PreAuthorize("hasRole('FINANCE_OFFICER')") checks.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    /**
     * Spring Security uses email as the username identifier.
     */
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired()     { return true; }

    @Override
    public boolean isAccountNonLocked()      { return active; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    /**
     * User is enabled only if active=true. Deactivated users cannot log in.
     */
    @Override
    public boolean isEnabled()               { return active; }
}
