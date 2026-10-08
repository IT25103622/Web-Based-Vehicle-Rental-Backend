-- =====================================================================
-- Web-Based Vehicle Rental Service - Unified Platform Schema
-- Run this in MySQL Workbench (or `mysql -u root -p < schema.sql`)
-- before starting the Spring Boot app the first time.
--
-- Merges the schemas each teammate was building against one shared
-- database (Access Control, Booking, Fleet/Inspection, Support, Pricing).
-- Hibernate is set to ddl-auto=update, so it WILL create/adjust tables
-- itself on first boot too - this script exists to guarantee seed data
-- (roles, permissions, the first admin account, the canonical `vehicles`
-- table other modules key off of) and the audit-log immutability
-- triggers that Hibernate cannot create for you. Tables this script does
-- not define (vehicle_inspections, damage_reports, uploaded_images,
-- support_tickets, discount_rules, promotions) are created automatically
-- by Hibernate from the JPA entities on first boot.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS sliit_vehicle_rental_db;
USE sliit_vehicle_rental_db;

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
    ('VIEW_OWN_BOOKINGS',         'Customers: view/manage their own bookings',    'CUSTOMER'),
    ('INSPECT_VEHICLE',           'Record vehicle return/handover inspections',   'OPERATIONS'),
    ('VIEW_SUPPORT_TICKETS',      'View customer support tickets',                'SUPPORT'),
    ('MANAGE_SUPPORT_TICKETS',    'Update/resolve customer support tickets',      'SUPPORT'),
    ('MANAGE_DISCOUNTS',          'Manage discount rules & promotions (Pricing module)', 'OPERATIONS')
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
    ('VIEW_USERS','VIEW_ANALYTICS','MANAGE_BOOKINGS','MANAGE_FLEET','VIEW_ROLES',
     'INSPECT_VEHICLE','VIEW_SUPPORT_TICKETS','MANAGE_SUPPORT_TICKETS','MANAGE_DISCOUNTS')
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SUPERVISOR' AND p.code IN
    ('VIEW_USERS','MANAGE_BOOKINGS','MANAGE_FLEET','RESET_USER_PASSWORD',
     'INSPECT_VEHICLE','VIEW_SUPPORT_TICKETS','MANAGE_SUPPORT_TICKETS','MANAGE_DISCOUNTS')
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SENIOR_EMPLOYEE' AND p.code IN
    ('MANAGE_BOOKINGS','MANAGE_FLEET','INSPECT_VEHICLE','VIEW_SUPPORT_TICKETS','MANAGE_SUPPORT_TICKETS')
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'JUNIOR_EMPLOYEE' AND p.code IN ('MANAGE_BOOKINGS','VIEW_SUPPORT_TICKETS')
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

-- =====================================================================
-- Fleet & Vehicle Records (UC-03, Sampath) - the canonical `vehicles`
-- table. Every other module (Booking/UC-02, Inspection/UC-04, Support,
-- Pricing) references this same table rather than keeping its own copy.
-- =====================================================================
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(30) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    seating_capacity INT NOT NULL,
    rental_rate DECIMAL(10, 2) NOT NULL,
    mileage DOUBLE NOT NULL DEFAULT 0,
    fuel_level INT NOT NULL DEFAULT 100,
    vehicle_condition VARCHAR(30) NOT NULL DEFAULT 'GOOD',
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    license_number VARCHAR(100),
    license_expiry_date DATE,
    operational_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    image_url VARCHAR(255),
    description TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    INDEX idx_vehicles_reg_num (registration_number),
    INDEX idx_vehicles_status (operational_status),
    INDEX idx_vehicles_active (active),
    INDEX idx_vehicles_ins_expiry (insurance_expiry_date),
    INDEX idx_vehicles_lic_expiry (license_expiry_date)
);

-- A handful of demo vehicles so the merged system has something to
-- browse/book/inspect immediately after first boot.
INSERT INTO vehicles (registration_number, vehicle_type, brand, model, seating_capacity, rental_rate,
                       mileage, fuel_level, vehicle_condition, insurance_policy_number, insurance_expiry_date,
                       license_number, license_expiry_date, operational_status, active, description, created_at)
VALUES
    ('WP-CAB-1001', 'SEDAN',  'Toyota',   'Corolla',       5, 8500.00,  15000, 90, 'EXCELLENT', 'INS-TY-1001', DATE_ADD(CURDATE(), INTERVAL 180 DAY), 'LIC-1001', DATE_ADD(CURDATE(), INTERVAL 180 DAY), 'AVAILABLE', TRUE, 'Reliable daily-driver sedan.', NOW()),
    ('WP-CAB-1002', 'SUV',    'Toyota',   'Prado',         7, 18500.00, 42000, 75, 'GOOD',      'INS-TY-1002', DATE_ADD(CURDATE(), INTERVAL 20 DAY),  'LIC-1002', DATE_ADD(CURDATE(), INTERVAL 90 DAY),  'AVAILABLE', TRUE, 'Spacious SUV, great for families.', NOW()),
    ('WP-CAB-1003', 'LUXURY', 'BMW',      '5 Series',      5, 25000.00, 8000,  100,'EXCELLENT', 'INS-BW-1003', DATE_ADD(CURDATE(), INTERVAL 300 DAY), 'LIC-1003', DATE_ADD(CURDATE(), INTERVAL 300 DAY), 'AVAILABLE', TRUE, 'Premium executive sedan.', NOW()),
    ('WP-CAB-1004', 'LUXURY', 'Mercedes-Benz', 'C-Class',  5, 27000.00, 5000,  95, 'EXCELLENT', 'INS-MB-1004', DATE_ADD(CURDATE(), INTERVAL 300 DAY), 'LIC-1004', DATE_ADD(CURDATE(), INTERVAL 300 DAY), 'AVAILABLE', TRUE, 'Top-tier luxury saloon.', NOW()),
    ('WP-CAB-1005', 'VAN',    'Toyota',   'HiAce',        12, 15000.00, 60000, 60, 'FAIR',      'INS-TY-1005', DATE_ADD(CURDATE(), INTERVAL 10 DAY),  'LIC-1005', DATE_ADD(CURDATE(), INTERVAL 45 DAY),  'MAINTENANCE', TRUE, 'Group/van transport.', NOW()),
    ('WP-CAB-1006', 'HATCHBACK', 'Suzuki', 'Swift',        5, 6500.00,  22000, 85, 'GOOD',      'INS-SZ-1006', DATE_ADD(CURDATE(), INTERVAL 150 DAY), 'LIC-1006', DATE_ADD(CURDATE(), INTERVAL 150 DAY), 'AVAILABLE', TRUE, 'Economical city hatchback.', NOW())
ON DUPLICATE KEY UPDATE registration_number = registration_number;

-- =====================================================================
-- Booking & Vehicle Search (UC-02, Maduwerachchi)
-- =====================================================================
CREATE TABLE IF NOT EXISTS bookings (
    booking_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(30),
    pickup_location VARCHAR(100) NOT NULL,
    dropoff_location VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    comment TEXT,
    booking_status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
);
