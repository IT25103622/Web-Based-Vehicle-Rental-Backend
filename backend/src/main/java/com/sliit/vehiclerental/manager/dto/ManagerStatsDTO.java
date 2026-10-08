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

    public long getTotalVehicles() { return totalVehicles; }
    public long getAvailableVehicles() { return availableVehicles; }
    public long getReservedVehicles() { return reservedVehicles; }
    public long getMaintenanceVehicles() { return maintenanceVehicles; }
    public long getActiveBookings() { return activeBookings; }
    public long getCancelledBookings() { return cancelledBookings; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
}
