package com.sliit.vehiclerental.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class BookingRequestDTO {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotBlank(message = "Pickup location is required")
    private String pickupLocation;

    @NotBlank(message = "Drop-off location is required")
    private String dropoffLocation;

    @NotNull(message = "Pickup date is required")
    private LocalDate startDate;

    @NotNull(message = "Drop-off date is required")
    private LocalDate endDate;

    private String comment;

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public String getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }
    public String getDropoffLocation() { return dropoffLocation; }
    public void setDropoffLocation(String dropoffLocation) { this.dropoffLocation = dropoffLocation; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
