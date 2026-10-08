package com.sliit.vehiclerental.inspection.dto;

import com.sliit.vehiclerental.fleet.entity.VehicleCondition;
import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;
import com.sliit.vehiclerental.inspection.entity.InspectionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionResponse {

    private Long id;
    private java.util.List<com.sliit.vehiclerental.media.ImageDto> images;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private String vehicleBrand;
    private String vehicleModel;
    private String bookingReference;

    private InspectionType inspectionType;

    private Long inspectorId;
    private String inspectorName;
    private LocalDateTime inspectionDate;

    private Double odometerReading;
    private Integer fuelLevel;
    private VehicleCondition condition;

    private boolean spareTirePresent;
    private boolean jackAndToolsPresent;
    private boolean registrationDocPresent;
    private boolean firstAidKitPresent;

    private String cleanliness;
    private String notes;

    private DamageReportDto damageReport;
    private com.sliit.vehiclerental.inspection.entity.RepairStatus repairStatus;
    private VehicleOperationalStatus resultingVehicleStatus;

    private InspectionComparisonDto comparison;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
