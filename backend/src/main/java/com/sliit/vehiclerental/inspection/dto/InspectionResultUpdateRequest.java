package com.sliit.vehiclerental.inspection.dto;
import com.sliit.vehiclerental.inspection.entity.RepairStatus;
import com.sliit.vehiclerental.fleet.entity.VehicleCondition;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
public record InspectionResultUpdateRequest(@NotNull RepairStatus repairStatus,
        @NotNull VehicleCondition condition, @Size(max = 5000) String notes) {}
