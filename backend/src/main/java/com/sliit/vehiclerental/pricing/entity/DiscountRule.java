package com.sliit.vehiclerental.pricing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Ported from the original Discounts & Promotions module (Wijesinghe),
 * which was written in Node.js/TypeScript against MongoDB. Rewritten here
 * as a Spring Boot / JPA module against the shared MySQL database so it
 * runs in the same process as every other module.
 */
@Entity
@Table(name = "discount_rules", uniqueConstraints = @UniqueConstraint(columnNames = {"rule_type", "target_identifier"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscountRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_name", nullable = false, length = 150)
    private String ruleName;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false, length = 30)
    private DiscountRuleType ruleType;

    @Column(name = "target_identifier", nullable = false, length = 100)
    private String targetIdentifier;

    @Column(name = "discount_percentage", nullable = false)
    private Double discountPercentage;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
