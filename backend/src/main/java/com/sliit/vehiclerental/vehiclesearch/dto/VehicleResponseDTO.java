package com.sliit.vehiclerental.vehiclesearch.dto;

import com.sliit.vehiclerental.fleet.entity.Vehicle;
import com.sliit.vehiclerental.fleet.entity.VehicleCondition;
import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;
import com.sliit.vehiclerental.fleet.entity.VehicleType;

import java.math.BigDecimal;

/**
 * Public, customer-facing view of a vehicle (UC-02 Search & Book). Backed by
 * the same canonical fleet.entity.Vehicle the Fleet module (UC-03) owns.
 */
public class VehicleResponseDTO {

    private Long vehicleId;
    private String registrationNumber;
    private VehicleType vehicleType;
    private String brand;
    private String model;
    private Integer seatingCapacity;
    private BigDecimal rentalRate;
    private Double mileage;
    private Integer fuelLevel;
    private VehicleCondition condition;
    private VehicleOperationalStatus operationalStatus;
    private String imageUrl;
    private String description;
    private boolean available;
    private String availabilityMessage;

    public static VehicleResponseDTO fromEntity(Vehicle vehicle, boolean available, String availabilityMessage) {
        VehicleResponseDTO dto = new VehicleResponseDTO();
        dto.vehicleId = vehicle.getId();
        dto.registrationNumber = vehicle.getRegistrationNumber();
        dto.vehicleType = vehicle.getVehicleType();
        dto.brand = vehicle.getBrand();
        dto.model = vehicle.getModel();
        dto.seatingCapacity = vehicle.getSeatingCapacity();
        dto.rentalRate = vehicle.getRentalRate();
        dto.mileage = vehicle.getMileage();
        dto.fuelLevel = vehicle.getFuelLevel();
        dto.condition = vehicle.getCondition();
        dto.operationalStatus = vehicle.getOperationalStatus();
        dto.imageUrl = vehicle.getImageUrl();
        dto.description = vehicle.getDescription();
        dto.available = available;
        dto.availabilityMessage = availabilityMessage;
        return dto;
    }

    public Long getVehicleId() { return vehicleId; }
    public String getRegistrationNumber() { return registrationNumber; }
    public VehicleType getVehicleType() { return vehicleType; }
    public String getBrand() { return brand; }
    public String getModel() { return model; }
    public Integer getSeatingCapacity() { return seatingCapacity; }
    public BigDecimal getRentalRate() { return rentalRate; }
    public Double getMileage() { return mileage; }
    public Integer getFuelLevel() { return fuelLevel; }
    public VehicleCondition getCondition() { return condition; }
    public VehicleOperationalStatus getOperationalStatus() { return operationalStatus; }
    public String getImageUrl() { return imageUrl; }
    public String getDescription() { return description; }
    public boolean isAvailable() { return available; }
    public String getAvailabilityMessage() { return availabilityMessage; }
}
