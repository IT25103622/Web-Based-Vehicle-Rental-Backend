package com.sliit.vehiclerental.vehiclesearch.service;

import com.sliit.vehiclerental.booking.entity.Booking;
import com.sliit.vehiclerental.booking.entity.BookingStatus;
import com.sliit.vehiclerental.booking.repository.BookingRepository;
import com.sliit.vehiclerental.fleet.entity.Vehicle;
import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;
import com.sliit.vehiclerental.fleet.entity.VehicleType;
import com.sliit.vehiclerental.fleet.repository.VehicleRepository;
import com.sliit.vehiclerental.vehiclesearch.dto.VehicleResponseDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Public customer-facing vehicle search & availability (UC-02). Reads the
 * same canonical `vehicles` table the Fleet module (UC-03) manages, but
 * exposes only what a customer needs - no permission check, unlike
 * fleet.controller.VehicleController which is manager-only CRUD.
 */
@Service
@Transactional(readOnly = true)
public class VehicleSearchService {

    private final VehicleRepository vehicleRepository;
    private final BookingRepository bookingRepository;

    public VehicleSearchService(VehicleRepository vehicleRepository, BookingRepository bookingRepository) {
        this.vehicleRepository = vehicleRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findByActiveTrue();
    }

    public VehicleResponseDTO getVehicleDetailsWithAvailability(Long vehicleId, LocalDate startDate, LocalDate endDate) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found with ID: " + vehicleId));

        if (startDate != null && endDate != null) {
            boolean available = isVehicleAvailable(vehicleId, startDate, endDate);
            String message = available ? "Vehicle is available for selected dates." : getUnavailabilityReason(vehicle, startDate, endDate);
            return VehicleResponseDTO.fromEntity(vehicle, available, message);
        } else {
            boolean available = vehicle.isActive() && vehicle.getOperationalStatus() == VehicleOperationalStatus.AVAILABLE;
            String message = available ? "Vehicle is ready for rental." : "Vehicle is currently " + vehicle.getOperationalStatus();
            return VehicleResponseDTO.fromEntity(vehicle, available, message);
        }
    }

    public List<VehicleResponseDTO> searchVehicles(LocalDate startDate, LocalDate endDate,
                                                  VehicleType vehicleType, BigDecimal maxPrice,
                                                  String pickupLocation) {
        List<Vehicle> matchedVehicles = vehicleRepository.findVehiclesWithFilters(vehicleType, maxPrice);
        List<VehicleResponseDTO> results = new ArrayList<>();

        for (Vehicle vehicle : matchedVehicles) {
            boolean available;
            String availabilityMsg;

            if (startDate != null && endDate != null) {
                available = isVehicleAvailable(vehicle.getId(), startDate, endDate);
                availabilityMsg = available
                        ? "Available for your dates (" + startDate + " to " + endDate + ")"
                        : getUnavailabilityReason(vehicle, startDate, endDate);
            } else {
                available = vehicle.isActive() && vehicle.getOperationalStatus() == VehicleOperationalStatus.AVAILABLE;
                availabilityMsg = available ? "Available" : "Status: " + vehicle.getOperationalStatus();
            }

            results.add(VehicleResponseDTO.fromEntity(vehicle, available, availabilityMsg));
        }

        return results;
    }

    /**
     * Core UC-02 Availability Check:
     * 1. Vehicle is active and operational status must be AVAILABLE
     * 2. No active (non-cancelled) bookings overlap
     */
    public boolean isVehicleAvailable(Long vehicleId, LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null || !endDate.isAfter(startDate)) {
            return false;
        }

        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);
        if (vehicle == null || !vehicle.isActive() || vehicle.getOperationalStatus() != VehicleOperationalStatus.AVAILABLE) {
            return false;
        }

        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                vehicleId, startDate, endDate, BookingStatus.CANCELLED);

        return overlapping.isEmpty();
    }

    private String getUnavailabilityReason(Vehicle vehicle, LocalDate startDate, LocalDate endDate) {
        if (!vehicle.isActive() || vehicle.getOperationalStatus() != VehicleOperationalStatus.AVAILABLE) {
            return "Vehicle is currently " + vehicle.getOperationalStatus();
        }

        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                vehicle.getId(), startDate, endDate, BookingStatus.CANCELLED);

        if (!overlapping.isEmpty()) {
            Booking clash = overlapping.get(0);
            return "Booked from " + clash.getStartDate() + " to " + clash.getEndDate() + " (" + clash.getBookingStatus() + ")";
        }

        return "Not available";
    }
}
