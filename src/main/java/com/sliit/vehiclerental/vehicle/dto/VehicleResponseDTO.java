package com.sliit.vehiclerental.vehicle.dto;

import com.sliit.vehiclerental.vehicle.entity.OperationalStatus;
import com.sliit.vehiclerental.vehicle.entity.Vehicle;
import com.sliit.vehiclerental.vehicle.entity.VehicleType;

import java.math.BigDecimal;

public class VehicleResponseDTO {

    private Long vehicleId;
    private String registrationNumber;
    private VehicleType vehicleType;
    private String brand;
    private String model;
    private Integer seatingCapacity;
    private BigDecimal rentalRate;
    private Integer mileage;
    private String fuelLevel;
    private String vehicleCondition;
    private OperationalStatus operationalStatus;
    private String imageUrl;
    private String description;
    private boolean available;
    private String availabilityMessage;

    public VehicleResponseDTO() {
    }

    public static VehicleResponseDTO fromEntity(Vehicle vehicle, boolean available, String availabilityMessage) {
        VehicleResponseDTO dto = new VehicleResponseDTO();
        dto.setVehicleId(vehicle.getVehicleId());
        dto.setRegistrationNumber(vehicle.getRegistrationNumber());
        dto.setVehicleType(vehicle.getVehicleType());
        dto.setBrand(vehicle.getBrand());
        dto.setModel(vehicle.getModel());
        dto.setSeatingCapacity(vehicle.getSeatingCapacity());
        dto.setRentalRate(vehicle.getRentalRate());
        dto.setMileage(vehicle.getMileage());
        dto.setFuelLevel(vehicle.getFuelLevel());
        dto.setVehicleCondition(vehicle.getVehicleCondition());
        dto.setOperationalStatus(vehicle.getOperationalStatus());
        dto.setImageUrl(vehicle.getImageUrl());
        dto.setDescription(vehicle.getDescription());
        dto.setAvailable(available);
        dto.setAvailabilityMessage(availabilityMessage);
        return dto;
    }

    // Getters and Setters
    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getSeatingCapacity() {
        return seatingCapacity;
    }

    public void setSeatingCapacity(Integer seatingCapacity) {
        this.seatingCapacity = seatingCapacity;
    }

    public BigDecimal getRentalRate() {
        return rentalRate;
    }

    public void setRentalRate(BigDecimal rentalRate) {
        this.rentalRate = rentalRate;
    }

    public Integer getMileage() {
        return mileage;
    }

    public void setMileage(Integer mileage) {
        this.mileage = mileage;
    }

    public String getFuelLevel() {
        return fuelLevel;
    }

    public void setFuelLevel(String fuelLevel) {
        this.fuelLevel = fuelLevel;
    }

    public String getVehicleCondition() {
        return vehicleCondition;
    }

    public void setVehicleCondition(String vehicleCondition) {
        this.vehicleCondition = vehicleCondition;
    }

    public OperationalStatus getOperationalStatus() {
        return operationalStatus;
    }

    public void setOperationalStatus(OperationalStatus operationalStatus) {
        this.operationalStatus = operationalStatus;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public String getAvailabilityMessage() {
        return availabilityMessage;
    }

    public void setAvailabilityMessage(String availabilityMessage) {
        this.availabilityMessage = availabilityMessage;
    }
}
