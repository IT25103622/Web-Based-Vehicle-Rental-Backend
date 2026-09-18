package com.sliit.vehiclerental.accesscontrol.entity;

/**
 * Fixed set of roles across the platform. Role *names* are fixed (per project
 * scope decision), but the permissions attached to each role are configurable
 * at runtime by a System Administrator via role_permissions.
 */
public enum RoleName {
    CUSTOMER,
    JUNIOR_EMPLOYEE,
    SENIOR_EMPLOYEE,
    SUPERVISOR,
    MANAGER,
    IT_SECURITY,
    SYSTEM_ADMIN
}
