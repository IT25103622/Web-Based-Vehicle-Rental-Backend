package com.sliit.vehiclerental.fleet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FleetDashboardDto {

    private long totalVehicles;
    private long availableVehicles;
    private long reservedVehicles;
    private long rentedVehicles;
    private long maintenanceVehicles;
    private long outOfServiceVehicles;
    private long deactivatedVehicles;

    private long documentsRequiringAttentionCount;
    private List<RenewalAlertDto> alerts;
}
