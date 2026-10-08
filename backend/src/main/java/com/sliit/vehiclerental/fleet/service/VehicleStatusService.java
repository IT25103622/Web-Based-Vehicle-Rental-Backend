package com.sliit.vehiclerental.fleet.service;

import com.sliit.vehiclerental.fleet.entity.Vehicle;
import com.sliit.vehiclerental.fleet.entity.VehicleCondition;
import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;

/**
 * Public integration interface for other modules (Booking UC-02, Inspection UC-04)
 * to query availability and transition vehicle operational statuses cleanly.
 */
public interface VehicleStatusService {

    boolean isVehicleAvailableForBooking(Long vehicleId);

    Vehicle getVehicleOrThrow(Long vehicleId);

    void setVehicleReserved(Long vehicleId, String bookingReference);

    void setVehicleRented(Long vehicleId, String bookingReference);

    void setVehicleAvailable(Long vehicleId, String reason);

    void setVehicleMaintenance(Long vehicleId, String reason);

    void setVehicleOutOfService(Long vehicleId, String reason);

    void updateInspectionResults(Long vehicleId,
                                 Double mileage,
                                 Integer fuelLevel,
                                 VehicleCondition condition,
                                 VehicleOperationalStatus status,
                                 String auditNotes);
    void deleteVehiclePermanently(Long id);
}

