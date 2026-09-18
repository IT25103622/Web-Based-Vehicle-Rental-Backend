package com.sliit.vehiclerental.accesscontrol.security;

/**
 * Single source of truth for permission codes referenced from Java code.
 * The authoritative row-level data still lives in the `permissions` table
 * (see database/schema.sql) - this class just avoids magic strings scattered
 * across controllers/services and typos between the two.
 */
public final class PermissionCodes {

    private PermissionCodes() {}

    // User management
    public static final String CREATE_USER = "CREATE_USER";
    public static final String VIEW_USERS = "VIEW_USERS";
    public static final String UPDATE_USER = "UPDATE_USER";
    public static final String DEACTIVATE_USER = "DEACTIVATE_USER";
    public static final String RESET_USER_PASSWORD = "RESET_USER_PASSWORD";

    // Roles & permissions
    public static final String VIEW_ROLES = "VIEW_ROLES";
    public static final String MANAGE_ROLE_PERMISSIONS = "MANAGE_ROLE_PERMISSIONS";

    // Audit
    public static final String VIEW_AUDIT_LOG = "VIEW_AUDIT_LOG";

    // Security settings
    public static final String CONFIGURE_MFA = "CONFIGURE_MFA";
    public static final String CONFIGURE_SESSION_SETTINGS = "CONFIGURE_SESSION_SETTINGS";

    // Backup monitoring
    public static final String VIEW_BACKUP_STATUS = "VIEW_BACKUP_STATUS";
    public static final String TRIGGER_MANUAL_BACKUP = "TRIGGER_MANUAL_BACKUP";

    // Analytics (cross-module, other groups' features report into this)
    public static final String VIEW_ANALYTICS = "VIEW_ANALYTICS";

    // Booking / fleet / payments - placeholders other teammates' modules
    // will actually enforce; declared here so the permission matrix has them.
    public static final String MANAGE_BOOKINGS = "MANAGE_BOOKINGS";
    public static final String MANAGE_FLEET = "MANAGE_FLEET";
    public static final String MANAGE_PAYMENTS = "MANAGE_PAYMENTS";
    public static final String VIEW_OWN_BOOKINGS = "VIEW_OWN_BOOKINGS";
}
