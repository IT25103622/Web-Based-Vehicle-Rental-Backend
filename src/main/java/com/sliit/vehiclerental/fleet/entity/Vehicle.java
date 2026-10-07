package com.sliit.vehiclerental.fleet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Master Vehicle Entity for UC-03 (Manage Fleet and Vehicle Records).
 * Serves as the single source of truth across the entire platform.
 * Shared by Booking (UC-02) and Return & Inspection (UC-04).
 */
@Entity
@Table(name = "vehicles", indexes = {
        @Index(name = "idx_vehicles_reg_num", columnList = "registration_number", unique = true),
        @Index(name = "idx_vehicles_status", columnList = "operational_status"),
        @Index(name = "idx_vehicles_active", columnList = "active"),
        @Index(name = "idx_vehicles_ins_expiry", columnList = "insurance_expiry_date"),
        @Index(name = "idx_vehicles_lic_expiry", columnList = "license_expiry_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vehicle_id")
    private Long id;

    @Column(name = "registration_number", nullable = false, unique = true, length = 50)
    private String registrationNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false, length = 30)
    private VehicleType vehicleType;

    @Column(nullable = false, length = 100)
    private String brand;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(name = "seating_capacity", nullable = false)
    private Integer seatingCapacity;

    @Column(name = "rental_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal rentalRate;

    @Column(nullable = false)
    private Double mileage;

    @Column(name = "fuel_level", nullable = false)
    private Integer fuelLevel; // 0 - 100 percentage

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_condition", nullable = false, length = 30)
    private VehicleCondition condition;

    @Column(name = "insurance_policy_number", length = 100)
    private String insurancePolicyNumber;

    @Column(name = "insurance_expiry_date")
    private LocalDate insuranceExpiryDate;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(name = "license_expiry_date")
    private LocalDate licenseExpiryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "operational_status", nullable = false, length = 30)
    @Builder.Default
    private VehicleOperationalStatus operationalStatus = VehicleOperationalStatus.AVAILABLE;

    /**
     * Soft-delete flag: Deactivated vehicles cannot be selected for new bookings
     * but historical data is preserved permanently.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
        if (this.operationalStatus == null) {
            this.operationalStatus = VehicleOperationalStatus.AVAILABLE;
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
