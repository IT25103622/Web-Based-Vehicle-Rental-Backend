package com.sliit.vehiclerental.fleet.controller;

import com.sliit.vehiclerental.accesscontrol.security.PermissionCodes;
import com.sliit.vehiclerental.accesscontrol.security.RequiresPermission;
import com.sliit.vehiclerental.fleet.dto.*;
import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;
import com.sliit.vehiclerental.fleet.entity.VehicleType;
import com.sliit.vehiclerental.fleet.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fleet/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final com.sliit.vehiclerental.inspection.service.InspectionService inspectionService;

    @PostMapping(consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<VehicleResponse> createVehicle(@Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.createVehicle(request));
    }

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<VehicleResponse> createWithImages(
            @Valid @RequestPart("vehicle") VehicleRequest request,
            @RequestPart(value="images", required=false) java.util.List<org.springframework.web.multipart.MultipartFile> images) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.createVehicleWithImages(request, images));
    }

    @GetMapping
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<Page<VehicleResponse>> listVehicles(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) VehicleOperationalStatus status,
            @RequestParam(required = false) VehicleType vehicleType,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(vehicleService.listVehicles(query, status, vehicleType, active, page, size));
    }

    @GetMapping("/dashboard")
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<FleetDashboardDto> getDashboard() {
        return ResponseEntity.ok(vehicleService.getDashboardStats());
    }

    @GetMapping("/alerts")
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<List<RenewalAlertDto>> getRenewalAlerts() {
        return ResponseEntity.ok(vehicleService.getRenewalAlerts());
    }

    @GetMapping("/{id}")
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<VehicleResponse> getVehicleById(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @GetMapping("/{id}/booking-history")
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<VehicleBookingHistoryResponse> getBookingHistory(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getBookingHistory(id));
    }

    @GetMapping("/{id}/inspections")
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<List<com.sliit.vehiclerental.inspection.dto.InspectionResponse>> getVehicleInspections(@PathVariable Long id) {
        return ResponseEntity.ok(inspectionService.getVehicleInspections(id));
    }

    @PutMapping("/{id}")
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<VehicleResponse> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.ok(vehicleService.updateVehicle(id, request));
    }

    @PatchMapping("/{id}/deactivate")
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<VehicleResponse> deactivateVehicle(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.deactivateVehicle(id));
    }

    @PatchMapping("/{id}/reactivate")
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<VehicleResponse> reactivateVehicle(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.reactivateVehicle(id));
    }

    @PatchMapping("/{id}/status")
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<VehicleResponse> updateOperationalStatus(
            @PathVariable Long id,
            @Valid @RequestBody VehicleStatusUpdateRequest request) {
        return ResponseEntity.ok(vehicleService.updateOperationalStatus(id, request));
    }

    @DeleteMapping("/{id}/permanent")
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<Void> deleteVehiclePermanently(@PathVariable Long id) {
        vehicleService.deleteVehiclePermanently(id);
        return ResponseEntity.noContent().build();
    }


}
