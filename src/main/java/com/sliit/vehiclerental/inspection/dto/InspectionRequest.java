package com.sliit.vehiclerental.inspection.dto;

import com.sliit.vehiclerental.fleet.entity.VehicleCondition;
import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;
import com.sliit.vehiclerental.inspection.entity.InspectionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    private String bookingReference;

    @NotNull(message = "Inspection type is required (PRE_RENTAL or POST_RENTAL)")
    private InspectionType inspectionType;

    @NotNull(message = "Odometer reading is required")
    @Min(value = 0, message = "Odometer reading cannot be negative")
    private Double odometerReading;

    @NotNull(message = "Fuel level is required")
    @Min(value = 0, message = "Fuel level must be between 0 and 100")
    @Max(value = 100, message = "Fuel level must be between 0 and 100")
    private Integer fuelLevel;

    @NotNull(message = "Vehicle condition is required")
    private VehicleCondition condition;

    @Builder.Default
    private boolean spareTirePresent = true;
    @Builder.Default
    private boolean jackAndToolsPresent = true;
    @Builder.Default
    private boolean registrationDocPresent = true;
    @Builder.Default
    private boolean firstAidKitPresent = true;

    @Builder.Default
    private String cleanliness = "CLEAN";

    private String notes;

    private boolean hasDamage;

    private boolean repairRequired;

    @Valid
    private DamageReportDto damageReport;

    /** Optional override: if omitted, system determines automatically based on damage and condition */
    private VehicleOperationalStatus resultingVehicleStatus;
}
