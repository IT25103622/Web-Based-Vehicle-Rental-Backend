package com.sliit.vehiclerental.accesscontrol.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * A single, atomic permission that can be granted to a Role.
 * e.g. VIEW_AUDIT_LOG, CREATE_USER, RESET_USER_PASSWORD, VIEW_ANALYTICS...
 */
@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code; // e.g. "VIEW_AUDIT_LOG"

    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false, length = 50)
    private String category; // e.g. "USER_MANAGEMENT", "AUDIT", "SECURITY", "ANALYTICS"
}
