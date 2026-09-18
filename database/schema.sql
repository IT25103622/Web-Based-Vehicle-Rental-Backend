-- =====================================================================
-- Vehicle Rental Service - Access Control Module
-- Run this in MySQL Workbench (or `mysql -u root -p < schema.sql` via XAMPP)
-- before starting the Spring Boot app the first time.
--
-- Hibernate is set to ddl-auto=update, so it WILL create/adjust these
-- tables itself on first boot too - but running this script first gives
-- you the seed data (roles, permissions, the first admin account) and,
-- critically, the audit-log immutability triggers that Hibernate cannot
-- create for you.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS vehicle_rental_db;
USE vehicle_rental_db;

-- ---------------------------------------------------------------------
-- Roles (fixed set - see RoleName.java)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(255)
);

INSERT INTO roles (name, description) VALUES
    ('CUSTOMER',        'Platform customer - can browse and manage their own bookings'),
    ('JUNIOR_EMPLOYEE',  'Entry-level staff - limited operational access'),
    ('SENIOR_EMPLOYEE',  'Experienced staff - broader operational access'),
    ('SUPERVISOR',       'Supervises staff, approves exceptions'),
    ('MANAGER',          'Departmental manager - reporting & oversight'),
    ('IT_SECURITY',      'Manages security configuration, MFA, monitors audit log'),
    ('SYSTEM_ADMIN',     'Full platform administrator')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ---------------------------------------------------------------------
-- Permissions (atomic, toggleable per role)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL
);

INSERT INTO permissions (code, description, category) VALUES
    ('CREATE_USER',              'Create new customer/staff accounts',           'USER_MANAGEMENT'),
    ('VIEW_USERS',                'View the full user list',                      'USER_MANAGEMENT'),
    ('UPDATE_USER',               'Edit user details / role assignment',          'USER_MANAGEMENT'),
    ('DEACTIVATE_USER',           'Deactivate / reactivate accounts (soft-delete)','USER_MANAGEMENT'),
    ('RESET_USER_PASSWORD',       'Reset another user''s password',               'USER_MANAGEMENT'),
    ('VIEW_ROLES',                'View roles & their permission matrix',         'ROLES'),
    ('MANAGE_ROLE_PERMISSIONS',   'Toggle which permissions a role has',          'ROLES'),
    ('VIEW_AUDIT_LOG',            'View the system audit trail',                  'AUDIT'),
    ('CONFIGURE_MFA',             'Enable/disable MFA on accounts',               'SECURITY'),
    ('CONFIGURE_SESSION_SETTINGS','Change session timeout & other security settings','SECURITY'),
    ('VIEW_BACKUP_STATUS',        'View automated backup status',                 'BACKUP'),
    ('TRIGGER_MANUAL_BACKUP',     'Manually trigger a database backup',           'BACKUP'),
    ('VIEW_ANALYTICS',            'View cross-module analytics dashboards',       'ANALYTICS'),
    ('MANAGE_BOOKINGS',           'Manage bookings (Booking module)',             'OPERATIONS'),
    ('MANAGE_FLEET',              'Manage vehicle fleet (Fleet module)',          'OPERATIONS'),
    ('MANAGE_PAYMENTS',           'Manage payments (Payments module)',            'OPERATIONS'),
    ('VIEW_OWN_BOOKINGS',         'Customers: view/manage their own bookings',    'CUSTOMER')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ---------------------------------------------------------------------
-- Role <-> Permission join table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Default sensible starting matrix (Admin can change all of this later)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SYSTEM_ADMIN'
ON DUPLICATE KEY UPDATE role_id = role_id; -- SYSTEM_ADMIN starts with every permission

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'IT_SECURITY' AND p.code IN
    ('VIEW_USERS','VIEW_AUDIT_LOG','CONFIGURE_MFA','CONFIGURE_SESSION_SETTINGS',
     'VIEW_BACKUP_STATUS','TRIGGER_MANUAL_BACKUP','VIEW_ROLES')
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'MANAGER' AND p.code IN
    ('VIEW_USERS','VIEW_ANALYTICS','MANAGE_BOOKINGS','MANAGE_FLEET','VIEW_ROLES')
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SUPERVISOR' AND p.code IN
    ('VIEW_USERS','MANAGE_BOOKINGS','MANAGE_FLEET','RESET_USER_PASSWORD')
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SENIOR_EMPLOYEE' AND p.code IN ('MANAGE_BOOKINGS','MANAGE_FLEET')
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'JUNIOR_EMPLOYEE' AND p.code IN ('MANAGE_BOOKINGS')
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'CUSTOMER' AND p.code IN ('VIEW_OWN_BOOKINGS')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- ---------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    session_timeout_minutes INT,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Seed the first System Administrator account.
-- Password below is the BCrypt hash of: Admin@12345
-- CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN.
INSERT INTO users (full_name, email, password_hash, role_id, status, mfa_enabled, must_change_password, created_at)
SELECT 'System Administrator', 'admin@vehiclerental.local',
       '$2b$10$fjRcTHm.W6Q7IWeKC9EXl.Wdj1hyyGp5wXCblSynb5OfbMG/8vv9a',
       r.id, 'ACTIVE', FALSE, TRUE, NOW()
FROM roles r WHERE r.name = 'SYSTEM_ADMIN'
ON DUPLICATE KEY UPDATE email = email;

-- ---------------------------------------------------------------------
-- OTP codes (MFA)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    code VARCHAR(10) NOT NULL,
    purpose VARCHAR(30) NOT NULL DEFAULT 'LOGIN_MFA',
    expires_at DATETIME NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Audit logs - tamper-resistant by design
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_user_id BIGINT,
    actor_email VARCHAR(150),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(45),
    timestamp DATETIME NOT NULL
);

-- No application code path ever issues UPDATE/DELETE against this table
-- (see AuditLog.java / AuditLogRepository.java), but these triggers make
-- it true at the database level too, independent of the application layer.
DELIMITER $$

DROP TRIGGER IF EXISTS trg_audit_logs_no_update $$
CREATE TRIGGER trg_audit_logs_no_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'audit_logs is append-only: rows cannot be modified';
END$$

DROP TRIGGER IF EXISTS trg_audit_logs_no_delete $$
CREATE TRIGGER trg_audit_logs_no_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'audit_logs is append-only: rows cannot be deleted';
END$$

DELIMITER ;

-- ---------------------------------------------------------------------
-- Backup status monitoring
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backup_status (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    result VARCHAR(20) NOT NULL,
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    error_message TEXT
);

-- ---------------------------------------------------------------------
-- Platform-wide security settings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_settings (
    setting_key VARCHAR(60) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

INSERT INTO security_settings (setting_key, setting_value, description) VALUES
    ('SESSION_TIMEOUT_MINUTES', '30', 'Default session inactivity timeout applied platform-wide'),
    ('MFA_REQUIRED_FOR_STAFF', 'false', 'If true, all non-customer roles must have MFA enabled'),
    ('PASSWORD_MIN_LENGTH', '8', 'Minimum password length enforced on password change/reset')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
