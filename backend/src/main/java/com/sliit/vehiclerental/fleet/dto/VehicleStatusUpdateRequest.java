package com.sliit.vehiclerental.fleet.dto;

import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleStatusUpdateRequest {

    @NotNull(message = "Operational status is required")
    private VehicleOperationalStatus status;

    private String reason;
}
