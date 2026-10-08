package com.sliit.vehiclerental.inspection.service;

import com.sliit.vehiclerental.accesscontrol.exception.NotFoundException;
import com.sliit.vehiclerental.accesscontrol.security.UserPrincipal;
import com.sliit.vehiclerental.accesscontrol.service.AuditLogService;
import com.sliit.vehiclerental.fleet.entity.Vehicle;
import com.sliit.vehiclerental.fleet.entity.VehicleCondition;
import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;
import com.sliit.vehiclerental.fleet.service.VehicleStatusService;
import com.sliit.vehiclerental.inspection.dto.*;
import com.sliit.vehiclerental.inspection.entity.*;
import com.sliit.vehiclerental.inspection.repository.DamageReportRepository;
import com.sliit.vehiclerental.inspection.repository.VehicleInspectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InspectionService {

    private final VehicleInspectionRepository inspectionRepository;
    private final DamageReportRepository damageReportRepository;
    private final VehicleStatusService vehicleStatusService;
    private final AuditLogService auditLogService;
    private final com.sliit.vehiclerental.media.ImageService imageService;

    private final com.sliit.vehiclerental.booking.repository.BookingRepository bookingRepository;

    @Transactional
    public InspectionResponse recordInspectionWithImages(InspectionRequest request,
            java.util.List<org.springframework.web.multipart.MultipartFile> files) {
        imageService.validateUploads(files);
        InspectionResponse created = recordInspection(request);
        if (files != null && !files.isEmpty()) imageService.addInspectionImages(created.getId(), files);
        return getInspectionById(created.getId());
    }

    @Transactional
    public InspectionResponse recordInspection(InspectionRequest request) {
        Vehicle vehicle = vehicleStatusService.getVehicleOrThrow(request.getVehicleId());

        Long inspectorId = null;
        String inspectorName = "STAFF_INSPECTOR";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            inspectorId = principal.getId();
            inspectorName = principal.getUsername();
        }

        // Validate business rules
        if (request.getInspectionType() == InspectionType.POST_RENTAL) {
            if (request.getOdometerReading() < vehicle.getMileage()) {
                throw new IllegalArgumentException("Final odometer reading (" + request.getOdometerReading() +
                        " km) cannot be less than the recorded previous mileage (" + vehicle.getMileage() + " km).");
            }
        }

        // Determine resulting operational status
        boolean repairRequired = request.isRepairRequired() || (request.isHasDamage()
                && request.getDamageReport() != null && (request.getDamageReport().isRequiresImmediateRepair()
                || request.getDamageReport().getDamageSeverity() == DamageSeverity.SEVERE));
        VehicleOperationalStatus resultingStatus = repairRequired ? VehicleOperationalStatus.MAINTENANCE
                : request.getInspectionType() == InspectionType.PRE_RENTAL ? vehicle.getOperationalStatus()
                : request.getResultingVehicleStatus();
        if (resultingStatus == null) {
            resultingStatus = determineResultingStatus(request, vehicle);
        }

        if (resultingStatus == VehicleOperationalStatus.MAINTENANCE &&
                (request.isHasDamage() || request.getCondition() == VehicleCondition.FAIR)) repairRequired = true;
        if (hasUnresolvedRepair(vehicle.getId(), null)) resultingStatus = VehicleOperationalStatus.MAINTENANCE;
        VehicleInspection inspection = VehicleInspection.builder()
                .vehicle(vehicle)
                .bookingReference(request.getBookingReference())
                .inspectionType(request.getInspectionType())
                .inspectorId(inspectorId)
                .inspectorName(inspectorName)
                .inspectionDate(LocalDateTime.now())
                .odometerReading(request.getOdometerReading())
                .fuelLevel(request.getFuelLevel())
                .condition(request.getCondition())
                .spareTirePresent(request.isSpareTirePresent())
                .jackAndToolsPresent(request.isJackAndToolsPresent())
                .registrationDocPresent(request.isRegistrationDocPresent())
                .firstAidKitPresent(request.isFirstAidKitPresent())
                .cleanliness(request.getCleanliness() != null ? request.getCleanliness() : "CLEAN")
                .notes(request.getNotes())
                .resultingVehicleStatus(resultingStatus)
                .repairStatus(repairRequired ? RepairStatus.REQUIRED : RepairStatus.NOT_REQUIRED)
                .build();

        VehicleInspection savedInspection = inspectionRepository.save(inspection);

        // Process Damage Report if damage detected
        if (request.isHasDamage() && request.getDamageReport() != null) {
            DamageReportDto dDto = request.getDamageReport();
            DamageReport damageReport = DamageReport.builder()
                    .inspection(savedInspection)
                    .damageSeverity(dDto.getDamageSeverity() != null ? dDto.getDamageSeverity() : DamageSeverity.MINOR)
                    .damageDescription(dDto.getDamageDescription())
                    .damagedParts(dDto.getDamagedParts())
                    .photoUrl(dDto.getPhotoUrl())
                    .estimatedRepairCost(dDto.getEstimatedRepairCost() != null ? dDto.getEstimatedRepairCost() : BigDecimal.ZERO)
                    .requiresImmediateRepair(dDto.isRequiresImmediateRepair() || dDto.getDamageSeverity() == DamageSeverity.SEVERE)
                    .build();

            DamageReport savedDamage = damageReportRepository.save(damageReport);
            savedInspection.setDamageReport(savedDamage);
        }

        // Inspection alone does not start a rental. Repairs block both handover and return.
        if (request.getInspectionType() == InspectionType.PRE_RENTAL) {
            if (resultingStatus == VehicleOperationalStatus.MAINTENANCE) {
                vehicleStatusService.setVehicleMaintenance(vehicle.getId(), "Inspection #" + savedInspection.getId() + " requires repair");
            }
        } else {
            vehicleStatusService.updateInspectionResults(vehicle.getId(), request.getOdometerReading(),
                    request.getFuelLevel(), request.getCondition(), resultingStatus,
                    "Inspection #" + savedInspection.getId());
        }

        auditLogService.log(
                request.getInspectionType() == InspectionType.PRE_RENTAL ? "PRE_RENTAL_INSPECTION_RECORDED" : "POST_RENTAL_INSPECTION_RECORDED",
                "VEHICLE_INSPECTION",
                String.valueOf(savedInspection.getId()),
                "Inspection for Vehicle [" + vehicle.getRegistrationNumber() + "] resulting in status: " + resultingStatus,
                null
        );

        return mapToResponse(savedInspection);
    }

    public Page<InspectionResponse> listInspections(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "inspectionDate"));
        return inspectionRepository.findAllByOrderByInspectionDateDesc(pageRequest).map(this::mapToResponse);
    }

    public List<InspectionResponse> getVehicleInspections(Long vehicleId) {
        return inspectionRepository.findByVehicleIdOrderByInspectionDateDesc(vehicleId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public InspectionResponse getInspectionById(Long id) {
        VehicleInspection inspection = inspectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Inspection record not found with ID: " + id));
        return mapToResponse(inspection);
    }

    @Transactional
    public InspectionResponse updateInspectionNotes(Long id, String notes) {
        VehicleInspection inspection = inspectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Inspection record not found with ID: " + id));

        inspection.setNotes(notes);
        VehicleInspection saved = inspectionRepository.save(inspection);

        auditLogService.log("INSPECTION_UPDATED", "VEHICLE_INSPECTION", String.valueOf(saved.getId()),
                "Updated notes on inspection #" + saved.getId(), null);

        return mapToResponse(saved);
    }

    private RepairStatus effectiveRepairStatus(VehicleInspection i) {
        if (i.getRepairStatus() != null) return i.getRepairStatus();
        // Preserve repair obligations on legacy reports created before this feature.
        if (i.getDamageReport() != null && (i.getDamageReport().isRequiresImmediateRepair()
                || i.getResultingVehicleStatus() == VehicleOperationalStatus.MAINTENANCE
                || i.getResultingVehicleStatus() == VehicleOperationalStatus.OUT_OF_SERVICE)) return RepairStatus.REQUIRED;
        return RepairStatus.NOT_REQUIRED;
    }

    private boolean hasUnresolvedRepair(Long vehicleId, Long excludingId) {
        return inspectionRepository.findByVehicleIdOrderByInspectionDateDesc(vehicleId).stream()
                .anyMatch(i -> !java.util.Objects.equals(i.getId(), excludingId)
                        && effectiveRepairStatus(i) == RepairStatus.REQUIRED);
    }

    @Transactional
    public InspectionResponse updateInspectionResult(Long id, InspectionResultUpdateRequest request) {
        VehicleInspection i = inspectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Inspection record not found with ID: " + id));
        RepairStatus previous = effectiveRepairStatus(i);
        if (request.repairStatus() == RepairStatus.NOT_REQUIRED && previous != RepairStatus.NOT_REQUIRED)
            throw new IllegalArgumentException("Use Fixed to resolve a recorded repair requirement.");
        if (request.repairStatus() == RepairStatus.FIXED && previous == RepairStatus.NOT_REQUIRED)
            throw new IllegalArgumentException("This report has no repair requirement to mark Fixed.");
        if (request.repairStatus() == RepairStatus.FIXED &&
                (request.condition() == VehicleCondition.POOR || request.condition() == VehicleCondition.FAIR))
            throw new IllegalArgumentException("Confirm GOOD or EXCELLENT condition after repair.");
        Vehicle vehicle = vehicleStatusService.getVehicleOrThrow(i.getVehicle().getId());
        i.setRepairStatus(request.repairStatus());
        i.setNotes(request.notes());
        i.setCondition(request.condition());
        if (request.repairStatus() == RepairStatus.REQUIRED) {
            vehicleStatusService.setVehicleMaintenance(vehicle.getId(), "Repair required on inspection #" + id);
        } else if (request.repairStatus() == RepairStatus.FIXED && previous == RepairStatus.REQUIRED) {
            java.time.LocalDate today = java.time.LocalDate.now();
            boolean activeRental = bookingRepository.findByVehicle_IdAndBookingStatusNot(vehicle.getId(),
                    com.sliit.vehiclerental.booking.entity.BookingStatus.CANCELLED).stream()
                    .anyMatch(b -> !b.getStartDate().isAfter(today) && b.getEndDate().isAfter(today));
            if (vehicle.isActive() && vehicle.getOperationalStatus() == VehicleOperationalStatus.MAINTENANCE
                    && !hasUnresolvedRepair(vehicle.getId(), id) && !activeRental) {
                // Use current master readings, never overwrite them with an older report's readings.
                vehicleStatusService.updateInspectionResults(vehicle.getId(), vehicle.getMileage(),
                        vehicle.getFuelLevel(), request.condition(), VehicleOperationalStatus.AVAILABLE,
                        "Repair fixed on inspection #" + id);
            }
        }
        i.setResultingVehicleStatus(vehicle.getOperationalStatus());
        inspectionRepository.save(i);
        auditLogService.log("INSPECTION_RESULT_UPDATED", "VEHICLE_INSPECTION", String.valueOf(id),
                "Repair status " + previous + " -> " + request.repairStatus() + "; condition " + request.condition(), null);
        return mapToResponse(i);
    }

    @Transactional
    public void deleteInspection(Long id) {
        VehicleInspection i = inspectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Inspection record not found with ID: " + id));
        if (effectiveRepairStatus(i) == RepairStatus.REQUIRED)
            throw new IllegalStateException("Mark the repair Fixed before deleting this report. Deleting must not erase an unresolved repair.");
        imageService.removeForInspection(id);
        inspectionRepository.delete(i); // Cascades to the attached damage report.
        auditLogService.log("INSPECTION_DELETED", "VEHICLE_INSPECTION", String.valueOf(id),
                "Deleted inspection for vehicle " + i.getVehicle().getRegistrationNumber()
                        + "; vehicle status unchanged", null);
    }

    private VehicleOperationalStatus determineResultingStatus(InspectionRequest request, Vehicle vehicle) {
        if (request.getInspectionType() == InspectionType.PRE_RENTAL) {
            return vehicle.getOperationalStatus();
        }

        if (request.isHasDamage() && request.getDamageReport() != null) {
            DamageReportDto d = request.getDamageReport();
            if (d.getDamageSeverity() == DamageSeverity.SEVERE || d.isRequiresImmediateRepair()) {
                return VehicleOperationalStatus.OUT_OF_SERVICE;
            } else if (d.getDamageSeverity() == DamageSeverity.MODERATE) {
                return VehicleOperationalStatus.MAINTENANCE;
            }
        }

        if (request.getCondition() == VehicleCondition.POOR) {
            return VehicleOperationalStatus.OUT_OF_SERVICE;
        } else if (request.getCondition() == VehicleCondition.FAIR) {
            return VehicleOperationalStatus.MAINTENANCE;
        }

        return VehicleOperationalStatus.AVAILABLE;
    }

    private InspectionResponse mapToResponse(VehicleInspection inspection) {
        Vehicle v = inspection.getVehicle();

        DamageReportDto damageDto = null;
        if (inspection.getDamageReport() != null) {
            DamageReport dr = inspection.getDamageReport();
            damageDto = DamageReportDto.builder()
                    .id(dr.getId())
                    .damageSeverity(dr.getDamageSeverity())
                    .damageDescription(dr.getDamageDescription())
                    .damagedParts(dr.getDamagedParts())
                    .photoUrl(dr.getPhotoUrl())
                    .estimatedRepairCost(dr.getEstimatedRepairCost())
                    .requiresImmediateRepair(dr.isRequiresImmediateRepair())
                    .build();
        }

        InspectionComparisonDto comparison = null;
        if (inspection.getInspectionType() == InspectionType.POST_RENTAL) {
            comparison = buildComparison(inspection);
        }

        return InspectionResponse.builder()
                .id(inspection.getId())
                .images(imageService.inspectionImages(inspection.getId()))
                .vehicleId(v.getId())
                .vehicleRegistrationNumber(v.getRegistrationNumber())
                .vehicleBrand(v.getBrand())
                .vehicleModel(v.getModel())
                .bookingReference(inspection.getBookingReference())
                .inspectionType(inspection.getInspectionType())
                .inspectorId(inspection.getInspectorId())
                .inspectorName(inspection.getInspectorName())
                .inspectionDate(inspection.getInspectionDate())
                .odometerReading(inspection.getOdometerReading())
                .fuelLevel(inspection.getFuelLevel())
                .condition(inspection.getCondition())
                .spareTirePresent(inspection.isSpareTirePresent())
                .jackAndToolsPresent(inspection.isJackAndToolsPresent())
                .registrationDocPresent(inspection.isRegistrationDocPresent())
                .firstAidKitPresent(inspection.isFirstAidKitPresent())
                .cleanliness(inspection.getCleanliness())
                .notes(inspection.getNotes())
                .damageReport(damageDto)
                .repairStatus(effectiveRepairStatus(inspection))
                .resultingVehicleStatus(inspection.getResultingVehicleStatus())
                .comparison(comparison)
                .createdAt(inspection.getCreatedAt())
                .updatedAt(inspection.getUpdatedAt())
                .build();
    }

    private InspectionComparisonDto buildComparison(VehicleInspection postInspection) {
        Long vehicleId = postInspection.getVehicle().getId();
        Optional<VehicleInspection> preInspectionOpt = Optional.empty();

        if (postInspection.getBookingReference() != null && !postInspection.getBookingReference().isBlank()) {
            preInspectionOpt = inspectionRepository.findTopByVehicleIdAndBookingReferenceAndInspectionType(
                    vehicleId, postInspection.getBookingReference(), InspectionType.PRE_RENTAL);
        }

        if (preInspectionOpt.isEmpty()) {
            preInspectionOpt = inspectionRepository.findTopByVehicleIdAndInspectionTypeOrderByInspectionDateDesc(
                    vehicleId, InspectionType.PRE_RENTAL);
        }

        Double prevOdo = preInspectionOpt.map(VehicleInspection::getOdometerReading).orElse(postInspection.getOdometerReading());
        Integer prevFuel = preInspectionOpt.map(VehicleInspection::getFuelLevel).orElse(postInspection.getFuelLevel());
        VehicleCondition prevCond = preInspectionOpt.map(VehicleInspection::getCondition).orElse(postInspection.getCondition());

        Double mileageDiff = postInspection.getOdometerReading() - prevOdo;
        Integer fuelDiff = postInspection.getFuelLevel() - prevFuel;

        List<String> missing = new ArrayList<>();
        if (!postInspection.isSpareTirePresent() && preInspectionOpt.map(VehicleInspection::isSpareTirePresent).orElse(true)) {
            missing.add("Spare Tire");
        }
        if (!postInspection.isJackAndToolsPresent() && preInspectionOpt.map(VehicleInspection::isJackAndToolsPresent).orElse(true)) {
            missing.add("Jack and Emergency Tools");
        }
        if (!postInspection.isRegistrationDocPresent() && preInspectionOpt.map(VehicleInspection::isRegistrationDocPresent).orElse(true)) {
            missing.add("Registration Documents");
        }
        if (!postInspection.isFirstAidKitPresent() && preInspectionOpt.map(VehicleInspection::isFirstAidKitPresent).orElse(true)) {
            missing.add("First Aid Kit");
        }

        boolean damageDetected = postInspection.getDamageReport() != null;
        BigDecimal repairCost = damageDetected ? postInspection.getDamageReport().getEstimatedRepairCost() : BigDecimal.ZERO;

        String refundEligibility;
        if (!damageDetected && missing.isEmpty() && fuelDiff >= 0) {
            refundEligibility = "FULL_REFUND";
        } else if (repairCost.compareTo(new BigDecimal("500.00")) > 0) {
            refundEligibility = "OUTSTANDING_BALANCE";
        } else {
            refundEligibility = "DEDUCTION_REQUIRED";
        }

        return InspectionComparisonDto.builder()
                .previousOdometer(prevOdo)
                .finalOdometer(postInspection.getOdometerReading())
                .mileageDifference(mileageDiff)
                .previousFuelLevel(prevFuel)
                .finalFuelLevel(postInspection.getFuelLevel())
                .fuelDifference(fuelDiff)
                .previousCondition(prevCond)
                .finalCondition(postInspection.getCondition())
                .missingItems(missing)
                .newDamageDetected(damageDetected)
                .damageSummary(damageDetected ? postInspection.getDamageReport().getDamageDescription() : "None")
                .estimatedRepairCost(repairCost)
                .recommendedVehicleStatus(postInspection.getResultingVehicleStatus())
                .depositRefundEligibility(refundEligibility)
                .build();
    }
}
