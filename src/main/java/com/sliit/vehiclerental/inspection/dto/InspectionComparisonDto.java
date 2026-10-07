package com.sliit.vehiclerental.inspection.dto;

import com.sliit.vehiclerental.fleet.entity.VehicleCondition;
import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionComparisonDto {

    private Double previousOdometer;
    private Double finalOdometer;
    private Double mileageDifference;

    private Integer previousFuelLevel;
    private Integer finalFuelLevel;
    private Integer fuelDifference; // negative means fuel consumed/missing

    private VehicleCondition previousCondition;
    private VehicleCondition finalCondition;

    private List<String> missingItems;
    private boolean newDamageDetected;
    private String damageSummary;
    private BigDecimal estimatedRepairCost;

    private VehicleOperationalStatus recommendedVehicleStatus;
    private String depositRefundEligibility; // FULL_REFUND, DEDUCTION_REQUIRED, OUTSTANDING_BALANCE
}
