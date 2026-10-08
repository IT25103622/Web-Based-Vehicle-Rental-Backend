package com.sliit.vehiclerental.accesscontrol.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Tamper-resistant audit trail entry.
 *
 * Deliberately has NO setters - once written it is never mutated by the
 * application layer. As a second line of defence, database/schema.sql adds
 * BEFORE UPDATE / BEFORE DELETE triggers on this table that abort the
 * statement, so even direct SQL access (or a compromised admin account)
 * cannot edit or delete history.
 */
@Entity
@Table(name = "audit_logs")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Null for unauthenticated events such as a failed login attempt. */
    private Long actorUserId;

    @Column(length = 150)
    private String actorEmail;

    @Column(nullable = false, length = 100)
    private String action; // e.g. "USER_CREATED", "LOGIN_SUCCESS", "PASSWORD_RESET", "ROLE_PERMISSIONS_UPDATED"

    @Column(length = 50)
    private String entityType; // e.g. "USER", "ROLE", "BOOKING", "PAYMENT"

    private String entityId;

    @Lob
    private String details; // free-form / JSON snapshot of what changed

    @Column(length = 45)
    private String ipAddress;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }
}
