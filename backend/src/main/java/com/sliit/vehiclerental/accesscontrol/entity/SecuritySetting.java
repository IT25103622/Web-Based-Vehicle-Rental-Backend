package com.sliit.vehiclerental.accesscontrol.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Platform-wide security configuration, editable by System Administrator /
 * IT Security roles from the Security Settings page. Key/value so new
 * settings can be added without a migration.
 */
@Entity
@Table(name = "security_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecuritySetting {

    @Id
    @Column(length = 60)
    private String settingKey; // e.g. "SESSION_TIMEOUT_MINUTES", "MFA_REQUIRED_FOR_STAFF"

    @Column(nullable = false, length = 255)
    private String settingValue;

    private String description;
}
