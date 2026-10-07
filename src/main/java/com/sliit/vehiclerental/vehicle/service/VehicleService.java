package com.sliit.vehiclerental.vehicle.service;

import com.sliit.vehiclerental.booking.entity.Booking;
import com.sliit.vehiclerental.booking.entity.BookingStatus;
import com.sliit.vehiclerental.booking.repository.BookingRepository;
import com.sliit.vehiclerental.vehicle.dto.VehicleResponseDTO;
import com.sliit.vehiclerental.vehicle.entity.OperationalStatus;
import com.sliit.vehiclerental.vehicle.entity.Vehicle;
import com.sliit.vehiclerental.vehicle.entity.VehicleType;
import com.sliit.vehiclerental.vehicle.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final BookingRepository bookingRepository;

    public VehicleService(VehicleRepository vehicleRepository, BookingRepository bookingRepository) {
        this.vehicleRepository = vehicleRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Optional<Vehicle> getVehicleById(Long id) {
        return vehicleRepository.findById(id);
    }

    public VehicleResponseDTO getVehicleDetailsWithAvailability(Long vehicleId, LocalDate startDate, LocalDate endDate) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found with ID: " + vehicleId));

        if (startDate != null && endDate != null) {
            boolean available = isVehicleAvailable(vehicleId, startDate, endDate);
            String message = available ? "Vehicle is available for selected dates." : getUnavailabilityReason(vehicle, startDate, endDate);
            return VehicleResponseDTO.fromEntity(vehicle, available, message);
        } else {
            boolean available = vehicle.getOperationalStatus() == OperationalStatus.AVAILABLE;
            String message = available ? "Vehicle is ready for rental." : "Vehicle is currently " + vehicle.getOperationalStatus();
            return VehicleResponseDTO.fromEntity(vehicle, available, message);
        }
    }

    /**
     * Search and filter vehicles by type, max price, and date availability.
     */
    public List<VehicleResponseDTO> searchVehicles(LocalDate startDate, LocalDate endDate,
                                                  VehicleType vehicleType, BigDecimal maxPrice,
                                                  String pickupLocation) {
        List<Vehicle> matchedVehicles = vehicleRepository.findVehiclesWithFilters(vehicleType, maxPrice);
        List<VehicleResponseDTO> results = new ArrayList<>();

        for (Vehicle vehicle : matchedVehicles) {
            boolean available;
            String availabilityMsg;

            if (startDate != null && endDate != null) {
                // Check if vehicle operational status is AVAILABLE and no overlapping active bookings exist
                available = isVehicleAvailable(vehicle.getVehicleId(), startDate, endDate);
                if (available) {
                    availabilityMsg = "Available for your dates (" + startDate + " to " + endDate + ")";
                } else {
                    availabilityMsg = getUnavailabilityReason(vehicle, startDate, endDate);
                }
            } else {
                available = vehicle.getOperationalStatus() == OperationalStatus.AVAILABLE;
                availabilityMsg = available ? "Available" : "Status: " + vehicle.getOperationalStatus();
            }

            results.add(VehicleResponseDTO.fromEntity(vehicle, available, availabilityMsg));
        }

        return results;
    }

    /**
     * Core UC-02 Availability Check:
     * 1. Operational status must be AVAILABLE
     * 2. No active (non-cancelled) bookings overlap:
     *    existing.startDate < requested.endDate AND existing.endDate > requested.startDate
     */
    public boolean isVehicleAvailable(Long vehicleId, LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null || !endDate.isAfter(startDate)) {
            return false;
        }

        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);
        if (vehicle == null || vehicle.getOperationalStatus() != OperationalStatus.AVAILABLE) {
            return false;
        }

        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                vehicleId, startDate, endDate, BookingStatus.CANCELLED);

        return overlapping.isEmpty();
    }

    private String getUnavailabilityReason(Vehicle vehicle, LocalDate startDate, LocalDate endDate) {
        if (vehicle.getOperationalStatus() != OperationalStatus.AVAILABLE) {
            return "Vehicle is currently " + vehicle.getOperationalStatus();
        }

        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                vehicle.getVehicleId(), startDate, endDate, BookingStatus.CANCELLED);

        if (!overlapping.isEmpty()) {
            Booking clash = overlapping.get(0);
            return "Booked from " + clash.getStartDate() + " to " + clash.getEndDate() + " (" + clash.getBookingStatus() + ")";
        }

        return "Not available";
    }
}
