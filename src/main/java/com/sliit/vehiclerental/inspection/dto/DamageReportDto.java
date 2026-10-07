package com.sliit.vehiclerental.inspection.dto;

import com.sliit.vehiclerental.inspection.entity.DamageSeverity;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DamageReportDto {

    private Long id;

    @NotNull(message = "Damage severity is required")
    private DamageSeverity damageSeverity;

    @NotBlank(message = "Damage description is required")
    private String damageDescription;

    private String damagedParts;

    private String photoUrl;

    @DecimalMin(value = "0.00", message = "Estimated repair cost cannot be negative")
    private BigDecimal estimatedRepairCost;

    private boolean requiresImmediateRepair;
}
