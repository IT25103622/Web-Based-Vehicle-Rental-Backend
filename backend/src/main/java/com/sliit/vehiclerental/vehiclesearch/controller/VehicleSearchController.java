package com.sliit.vehiclerental.vehiclesearch.controller;

import com.sliit.vehiclerental.fleet.entity.Vehicle;
import com.sliit.vehiclerental.fleet.entity.VehicleType;
import com.sliit.vehiclerental.vehiclesearch.dto.VehicleResponseDTO;
import com.sliit.vehiclerental.vehiclesearch.service.VehicleSearchService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Public vehicle browsing/search for customers (UC-02). No permission
 * required - anyone (including unauthenticated visitors) can browse the
 * fleet catalog and check availability before signing up/logging in.
 */
@RestController
@RequestMapping("/api/vehicles")
public class VehicleSearchController {

    private final VehicleSearchService vehicleSearchService;

    public VehicleSearchController(VehicleSearchService vehicleSearchService) {
        this.vehicleSearchService = vehicleSearchService;
    }

    @GetMapping
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleSearchService.getAllVehicles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponseDTO> getVehicleById(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(vehicleSearchService.getVehicleDetailsWithAvailability(id, startDate, endDate));
    }

    @GetMapping("/search")
    public ResponseEntity<List<VehicleResponseDTO>> searchVehicles(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) VehicleType vehicleType,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String pickupLocation) {

        if (startDate != null && endDate != null && !endDate.isAfter(startDate)) {
            throw new IllegalArgumentException("Drop-off date must be after pickup date.");
        }

        List<VehicleResponseDTO> vehicles = vehicleSearchService.searchVehicles(
                startDate, endDate, vehicleType, maxPrice, pickupLocation);
        return ResponseEntity.ok(vehicles);
    }
}
