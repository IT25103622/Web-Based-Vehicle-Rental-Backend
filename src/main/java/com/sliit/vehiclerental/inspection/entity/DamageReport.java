package com.sliit.vehiclerental.inspection.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "damage_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DamageReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private VehicleInspection inspection;

    @Enumerated(EnumType.STRING)
    @Column(name = "damage_severity", nullable = false, length = 30)
    private DamageSeverity damageSeverity;

    @Lob
    @Column(name = "damage_description", nullable = false)
    private String damageDescription;

    @Column(name = "damaged_parts", length = 255)
    private String damagedParts;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "estimated_repair_cost", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal estimatedRepairCost = BigDecimal.ZERO;

    @Column(name = "requires_immediate_repair", nullable = false)
    @Builder.Default
    private boolean requiresImmediateRepair = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.estimatedRepairCost == null) {
            this.estimatedRepairCost = BigDecimal.ZERO;
        }
    }
}
