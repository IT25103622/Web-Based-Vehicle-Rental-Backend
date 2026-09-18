package com.sliit.vehiclerental.accesscontrol.entity;

/**
 * Accounts are soft-deleted only - DEACTIVATED, never physically removed,
 * so the audit trail always resolves to a real historical account.
 */
public enum UserStatus {
    ACTIVE,
    DEACTIVATED
}
