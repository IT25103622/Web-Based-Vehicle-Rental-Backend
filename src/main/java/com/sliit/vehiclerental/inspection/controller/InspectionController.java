package com.sliit.vehiclerental.inspection.controller;

import com.sliit.vehiclerental.accesscontrol.security.PermissionCodes;
import com.sliit.vehiclerental.accesscontrol.security.RequiresPermission;
import com.sliit.vehiclerental.inspection.dto.InspectionRequest;
import com.sliit.vehiclerental.inspection.dto.InspectionResponse;
import com.sliit.vehiclerental.inspection.service.InspectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inspections")
@RequiredArgsConstructor
public class InspectionController {

    private final InspectionService inspectionService;

    @PostMapping(consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    @RequiresPermission(value = PermissionCodes.MANAGE_FLEET, anyOf = {PermissionCodes.INSPECT_VEHICLE})
    public ResponseEntity<InspectionResponse> recordInspection(@Valid @RequestBody InspectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inspectionService.recordInspection(request));
    }

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresPermission(value = PermissionCodes.MANAGE_FLEET, anyOf = {PermissionCodes.INSPECT_VEHICLE})
    public ResponseEntity<InspectionResponse> recordWithImages(
            @Valid @RequestPart("inspection") InspectionRequest request,
            @RequestPart(value="images", required=false) java.util.List<org.springframework.web.multipart.MultipartFile> images) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inspectionService.recordInspectionWithImages(request, images));
    }

    @GetMapping
    @RequiresPermission(value = PermissionCodes.MANAGE_FLEET, anyOf = {PermissionCodes.INSPECT_VEHICLE})
    public ResponseEntity<Page<InspectionResponse>> listInspections(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(inspectionService.listInspections(page, size));
    }

    @GetMapping("/{id}")
    @RequiresPermission(value = PermissionCodes.MANAGE_FLEET, anyOf = {PermissionCodes.INSPECT_VEHICLE})
    public ResponseEntity<InspectionResponse> getInspectionById(@PathVariable Long id) {
        return ResponseEntity.ok(inspectionService.getInspectionById(id));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @RequiresPermission(value = PermissionCodes.MANAGE_FLEET, anyOf = {PermissionCodes.INSPECT_VEHICLE})
    public ResponseEntity<List<InspectionResponse>> getVehicleInspections(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(inspectionService.getVehicleInspections(vehicleId));
    }

    @PatchMapping("/{id}/result")
    @RequiresPermission(value = PermissionCodes.MANAGE_FLEET, anyOf = {PermissionCodes.INSPECT_VEHICLE})
    public ResponseEntity<InspectionResponse> updateResult(@PathVariable Long id,
            @Valid @RequestBody com.sliit.vehiclerental.inspection.dto.InspectionResultUpdateRequest request) {
        return ResponseEntity.ok(inspectionService.updateInspectionResult(id, request));
    }

    @DeleteMapping("/{id}")
    @RequiresPermission(value = PermissionCodes.MANAGE_FLEET, anyOf = {PermissionCodes.INSPECT_VEHICLE})
    public ResponseEntity<Void> deleteInspection(@PathVariable Long id) {
        inspectionService.deleteInspection(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @RequiresPermission(value = PermissionCodes.MANAGE_FLEET, anyOf = {PermissionCodes.INSPECT_VEHICLE})
    public ResponseEntity<InspectionResponse> updateInspection(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String notes = body.getOrDefault("notes", "");
        return ResponseEntity.ok(inspectionService.updateInspectionNotes(id, notes));
    }
}
