package com.sliit.vehiclerental.inspection.entity;

import com.sliit.vehiclerental.fleet.entity.Vehicle;
import com.sliit.vehiclerental.fleet.entity.VehicleCondition;
import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_inspections", indexes = {
        @Index(name = "idx_inspections_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_inspections_type", columnList = "inspection_type"),
        @Index(name = "idx_inspections_booking", columnList = "booking_reference")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleInspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "booking_reference", length = 100)
    private String bookingReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_type", nullable = false, length = 30)
    private InspectionType inspectionType;

    @Column(name = "inspector_id")
    private Long inspectorId;

    @Column(name = "inspector_name", nullable = false, length = 150)
    private String inspectorName;

    @Column(name = "inspection_date", nullable = false)
    private LocalDateTime inspectionDate;

    @Column(name = "odometer_reading", nullable = false)
    private Double odometerReading;

    @Column(name = "fuel_level", nullable = false)
    private Integer fuelLevel; // 0 - 100 percentage

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_condition", nullable = false, length = 30)
    private VehicleCondition condition;

    // Equipment Checklist
    @Column(name = "spare_tire_present", nullable = false)
    @Builder.Default
    private boolean spareTirePresent = true;

    @Column(name = "jack_and_tools_present", nullable = false)
    @Builder.Default
    private boolean jackAndToolsPresent = true;

    @Column(name = "registration_doc_present", nullable = false)
    @Builder.Default
    private boolean registrationDocPresent = true;

    @Column(name = "first_aid_kit_present", nullable = false)
    @Builder.Default
    private boolean firstAidKitPresent = true;

    @Column(length = 50)
    @Builder.Default
    private String cleanliness = "CLEAN";

    @Lob
    private String notes;

    @OneToOne(mappedBy = "inspection", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private DamageReport damageReport;

    @Enumerated(EnumType.STRING)
    @Column(name = "resulting_vehicle_status", nullable = false, length = 30)
    private VehicleOperationalStatus resultingVehicleStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "repair_status", length = 30)
    @Builder.Default
    private RepairStatus repairStatus = RepairStatus.NOT_REQUIRED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
        if (this.inspectionDate == null) {
            this.inspectionDate = LocalDateTime.now();
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
