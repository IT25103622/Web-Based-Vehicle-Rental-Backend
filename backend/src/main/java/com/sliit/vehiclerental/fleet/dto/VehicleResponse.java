package com.sliit.vehiclerental.fleet.dto;

import com.sliit.vehiclerental.fleet.entity.VehicleCondition;
import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;
import com.sliit.vehiclerental.fleet.entity.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleResponse {

    private Long id;
    private java.util.List<com.sliit.vehiclerental.media.ImageDto> images;
    private String registrationNumber;
    private VehicleType vehicleType;
    private String brand;
    private String model;
    private Integer seatingCapacity;
    private BigDecimal rentalRate;
    private Double mileage;
    private Integer fuelLevel;
    private VehicleCondition condition;

    // Insurance
    private String insurancePolicyNumber;
    private LocalDate insuranceExpiryDate;
    private String insuranceStatus; // VALID, EXPIRING_SOON, EXPIRED
    private Long insuranceDaysUntilExpiry;

    // License
    private String licenseNumber;
    private LocalDate licenseExpiryDate;
    private String licenseStatus; // VALID, EXPIRING_SOON, EXPIRED
    private Long licenseDaysUntilExpiry;

    // Operational & Lifecycle Status
    private VehicleOperationalStatus operationalStatus;
    private boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
