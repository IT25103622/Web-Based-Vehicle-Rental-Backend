package com.sliit.vehiclerental.fleet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RenewalAlertDto {

    private Long vehicleId;
    private String registrationNumber;
    private String brand;
    private String model;
    private String documentType; // INSURANCE, LICENSE
    private String documentNumber;
    private LocalDate expiryDate;
    private Long daysRemaining;
    private String alertSeverity; // EXPIRING_SOON, EXPIRED
}
