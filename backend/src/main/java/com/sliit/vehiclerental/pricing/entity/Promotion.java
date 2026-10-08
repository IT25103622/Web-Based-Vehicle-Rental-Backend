package com.sliit.vehiclerental.pricing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "promotions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "promotion_code", nullable = false, unique = true, length = 50)
    private String promotionCode;

    @Column(name = "promotion_name", nullable = false, length = 150)
    private String promotionName;

    @Enumerated(EnumType.STRING)
    @Column(name = "promotion_type", nullable = false, length = 30)
    private PromotionType promotionType;

    @Column(name = "vehicle_category", nullable = false, length = 100)
    private String vehicleCategory;

    @Column(name = "discount_percentage", nullable = false)
    private Double discountPercentage;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "minimum_rental_days", nullable = false)
    @Builder.Default
    private Integer minimumRentalDays = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PromotionStatus status = PromotionStatus.ACTIVE;

    @Column(name = "promotion_image", length = 255)
    private String promotionImage;

    @Column(name = "banner_image", length = 255)
    private String bannerImage;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "usage_count", nullable = false)
    @Builder.Default
    private Long usageCount = 0L;

    @Column(name = "total_discount_granted", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalDiscountGranted = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) status = PromotionStatus.ACTIVE;
        if (minimumRentalDays == null) minimumRentalDays = 1;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
