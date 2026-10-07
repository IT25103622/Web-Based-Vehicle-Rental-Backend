package com.sliit.vehiclerental.manager.controller;

import com.sliit.vehiclerental.booking.dto.BookingResponseDTO;
import com.sliit.vehiclerental.booking.entity.Booking;
import com.sliit.vehiclerental.booking.entity.BookingStatus;
import com.sliit.vehiclerental.booking.repository.BookingRepository;
import com.sliit.vehiclerental.manager.dto.ManagerStatsDTO;
import com.sliit.vehiclerental.vehicle.entity.OperationalStatus;
import com.sliit.vehiclerental.vehicle.entity.Vehicle;
import com.sliit.vehiclerental.vehicle.repository.VehicleRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/manager")
@CrossOrigin(origins = "*")
public class ManagerController {

    private final VehicleRepository vehicleRepository;
    private final BookingRepository bookingRepository;

    public ManagerController(VehicleRepository vehicleRepository, BookingRepository bookingRepository) {
        this.vehicleRepository = vehicleRepository;
        this.bookingRepository = bookingRepository;
    }

    /**
     * Get Operations Manager Dashboard Statistics (KPIs).
     */
    @GetMapping("/stats")
    public ResponseEntity<ManagerStatsDTO> getDashboardStats() {
        long totalVehicles = vehicleRepository.count();
        long availableVehicles = vehicleRepository.findByOperationalStatus(OperationalStatus.AVAILABLE).size();
        long reservedVehicles = vehicleRepository.findByOperationalStatus(OperationalStatus.RESERVED).size();
        long maintenanceVehicles = vehicleRepository.findByOperationalStatus(OperationalStatus.MAINTENANCE).size()
                + vehicleRepository.findByOperationalStatus(OperationalStatus.OUT_OF_SERVICE).size();

        long activeBookings = bookingRepository.countByBookingStatusNot(BookingStatus.CANCELLED);
        long cancelledBookings = bookingRepository.countByBookingStatus(BookingStatus.CANCELLED);

        // Sum revenue from non-cancelled bookings
        List<Booking> allBookings = bookingRepository.findAll();
        BigDecimal totalRevenue = allBookings.stream()
                .filter(b -> b.getBookingStatus() != BookingStatus.CANCELLED)
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        ManagerStatsDTO stats = new ManagerStatsDTO(
                totalVehicles,
                availableVehicles,
                reservedVehicles,
                maintenanceVehicles,
                activeBookings,
                cancelledBookings,
                totalRevenue
        );

        return ResponseEntity.ok(stats);
    }

    /**
     * Get bookings with filters: status, vehicle, and date.
     */
    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponseDTO>> getManagerBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<Booking> list = bookingRepository.findAllByOrderByCreatedAtDesc();

        List<BookingResponseDTO> filtered = list.stream()
                .filter(b -> status == null || b.getBookingStatus() == status)
                .filter(b -> vehicleId == null || (b.getVehicle() != null && b.getVehicle().getVehicleId().equals(vehicleId)))
                .filter(b -> date == null || (!date.isBefore(b.getStartDate()) && !date.isAfter(b.getEndDate())))
                .map(BookingResponseDTO::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }

    /**
     * Get vehicle availability records.
     */
    @GetMapping("/availability")
    public ResponseEntity<List<Vehicle>> getVehicleAvailability() {
        return ResponseEntity.ok(vehicleRepository.findAll());
    }
}
