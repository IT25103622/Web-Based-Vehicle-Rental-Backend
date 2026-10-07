package com.sliit.vehiclerental.vehicle.controller;

import com.sliit.vehiclerental.vehicle.dto.VehicleResponseDTO;
import com.sliit.vehiclerental.vehicle.entity.Vehicle;
import com.sliit.vehiclerental.vehicle.entity.VehicleType;
import com.sliit.vehiclerental.vehicle.service.VehicleService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    /**
     * Get all vehicles in the fleet.
     */
    @GetMapping
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    /**
     * Get a specific vehicle with availability details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponseDTO> getVehicleById(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(vehicleService.getVehicleDetailsWithAvailability(id, startDate, endDate));
    }

    /**
     * Search and filter vehicles by rental dates, vehicle type, and max rental price.
     */
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

        List<VehicleResponseDTO> vehicles = vehicleService.searchVehicles(
                startDate, endDate, vehicleType, maxPrice, pickupLocation);
        return ResponseEntity.ok(vehicles);
    }
}
