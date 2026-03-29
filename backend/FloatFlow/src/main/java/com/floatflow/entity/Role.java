package com.floatflow.entity;

/**
 * Defines all user roles in FloatFlow.
 * These map to Spring Security's GrantedAuthority.
 */
public enum Role {
    ADMIN,
    FINANCE_OFFICER,
    BRANCH_MANAGER,
    EMPLOYEE,
    AUDITOR
}
