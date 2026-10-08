package com.sliit.vehiclerental.manager.controller;

import com.sliit.vehiclerental.accesscontrol.security.PermissionCodes;
import com.sliit.vehiclerental.accesscontrol.security.RequiresPermission;
import com.sliit.vehiclerental.booking.dto.BookingResponseDTO;
import com.sliit.vehiclerental.booking.entity.Booking;
import com.sliit.vehiclerental.booking.entity.BookingStatus;
import com.sliit.vehiclerental.booking.repository.BookingRepository;
import com.sliit.vehiclerental.manager.dto.ManagerStatsDTO;
import com.sliit.vehiclerental.fleet.entity.Vehicle;
import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;
import com.sliit.vehiclerental.fleet.repository.VehicleRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {

    private final VehicleRepository vehicleRepository;
    private final BookingRepository bookingRepository;

    public ManagerController(VehicleRepository vehicleRepository, BookingRepository bookingRepository) {
        this.vehicleRepository = vehicleRepository;
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/stats")
    @RequiresPermission(PermissionCodes.VIEW_ANALYTICS)
    public ResponseEntity<ManagerStatsDTO> getDashboardStats() {
        long totalVehicles = vehicleRepository.count();
        long availableVehicles = vehicleRepository.findByOperationalStatus(VehicleOperationalStatus.AVAILABLE).size();
        long reservedVehicles = vehicleRepository.findByOperationalStatus(VehicleOperationalStatus.RESERVED).size();
        long maintenanceVehicles = vehicleRepository.findByOperationalStatus(VehicleOperationalStatus.MAINTENANCE).size()
                + vehicleRepository.findByOperationalStatus(VehicleOperationalStatus.OUT_OF_SERVICE).size();

        long activeBookings = bookingRepository.countByBookingStatusNot(BookingStatus.CANCELLED);
        long cancelledBookings = bookingRepository.countByBookingStatus(BookingStatus.CANCELLED);

        List<Booking> allBookings = bookingRepository.findAll();
        BigDecimal totalRevenue = allBookings.stream()
                .filter(b -> b.getBookingStatus() != BookingStatus.CANCELLED)
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ResponseEntity.ok(new ManagerStatsDTO(
                totalVehicles, availableVehicles, reservedVehicles,
                maintenanceVehicles, activeBookings, cancelledBookings, totalRevenue));
    }

    @GetMapping("/bookings")
    @RequiresPermission(PermissionCodes.MANAGE_BOOKINGS)
    public ResponseEntity<List<BookingResponseDTO>> getManagerBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<Booking> list = bookingRepository.findAllByOrderByCreatedAtDesc();

        List<BookingResponseDTO> filtered = list.stream()
                .filter(b -> status == null || b.getBookingStatus() == status)
                .filter(b -> vehicleId == null || (b.getVehicle() != null && b.getVehicle().getId().equals(vehicleId)))
                .filter(b -> date == null || (!date.isBefore(b.getStartDate()) && !date.isAfter(b.getEndDate())))
                .map(BookingResponseDTO::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/availability")
    @RequiresPermission(PermissionCodes.MANAGE_BOOKINGS)
    public ResponseEntity<List<Vehicle>> getVehicleAvailability() {
        return ResponseEntity.ok(vehicleRepository.findAll());
    }
}
