package com.sliit.vehiclerental.pricing.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class EvaluatePromotionRequest {
    @NotNull(message = "vehicleId is required for promotion evaluation")
    private Long vehicleId;

    @NotNull(message = "pickupDate is required for promotion evaluation")
    private LocalDate pickupDate;

    @NotNull(message = "returnDate is required for promotion evaluation")
    private LocalDate returnDate;

    private Integer rentalDays;

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public LocalDate getPickupDate() { return pickupDate; }
    public void setPickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; }
    public LocalDate getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDate returnDate) { this.returnDate = returnDate; }
    public Integer getRentalDays() { return rentalDays; }
    public void setRentalDays(Integer rentalDays) { this.rentalDays = rentalDays; }
}
