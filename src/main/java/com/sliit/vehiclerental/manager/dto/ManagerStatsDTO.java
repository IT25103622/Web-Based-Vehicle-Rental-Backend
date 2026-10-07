package com.sliit.vehiclerental.manager.dto;

import java.math.BigDecimal;

public class ManagerStatsDTO {

    private long totalVehicles;
    private long availableVehicles;
    private long reservedVehicles;
    private long maintenanceVehicles;
    private long activeBookings;
    private long cancelledBookings;
    private BigDecimal totalRevenue;

    public ManagerStatsDTO() {
    }

    public ManagerStatsDTO(long totalVehicles, long availableVehicles, long reservedVehicles,
                           long maintenanceVehicles, long activeBookings, long cancelledBookings,
                           BigDecimal totalRevenue) {
        this.totalVehicles = totalVehicles;
        this.availableVehicles = availableVehicles;
        this.reservedVehicles = reservedVehicles;
        this.maintenanceVehicles = maintenanceVehicles;
        this.activeBookings = activeBookings;
        this.cancelledBookings = cancelledBookings;
        this.totalRevenue = totalRevenue;
    }

    // Getters and Setters
    public long getTotalVehicles() {
        return totalVehicles;
    }

    public void setTotalVehicles(long totalVehicles) {
        this.totalVehicles = totalVehicles;
    }

    public long getAvailableVehicles() {
        return availableVehicles;
    }

    public void setAvailableVehicles(long availableVehicles) {
        this.availableVehicles = availableVehicles;
    }

    public long getReservedVehicles() {
        return reservedVehicles;
    }

    public void setReservedVehicles(long reservedVehicles) {
        this.reservedVehicles = reservedVehicles;
    }

    public long getMaintenanceVehicles() {
        return maintenanceVehicles;
    }

    public void setMaintenanceVehicles(long maintenanceVehicles) {
        this.maintenanceVehicles = maintenanceVehicles;
    }

    public long getActiveBookings() {
        return activeBookings;
    }

    public void setActiveBookings(long activeBookings) {
        this.activeBookings = activeBookings;
    }

    public long getCancelledBookings() {
        return cancelledBookings;
    }

    public void setCancelledBookings(long cancelledBookings) {
        this.cancelledBookings = cancelledBookings;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}
