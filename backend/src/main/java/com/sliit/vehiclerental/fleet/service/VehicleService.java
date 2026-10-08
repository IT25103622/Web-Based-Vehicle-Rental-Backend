package com.sliit.vehiclerental.fleet.service;

import com.sliit.vehiclerental.accesscontrol.exception.NotFoundException;
import com.sliit.vehiclerental.accesscontrol.service.AuditLogService;
import com.sliit.vehiclerental.fleet.dto.*;
import com.sliit.vehiclerental.fleet.entity.*;
import com.sliit.vehiclerental.fleet.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleService implements VehicleStatusService {

    private final VehicleRepository vehicleRepository;
    private final com.sliit.vehiclerental.media.ImageService imageService;
    private final AuditLogService auditLogService;
    private final com.sliit.vehiclerental.booking.repository.BookingRepository bookingRepository;
    private final com.sliit.vehiclerental.inspection.repository.VehicleInspectionRepository inspectionRepository;

    @Value("${app.fleet.renewal-warning-days:30}")
    private int renewalWarningDays;

    @Transactional(readOnly = true)
    public VehicleBookingHistoryResponse getBookingHistory(Long id) {
        VehicleResponse vehicle = getVehicleById(id);
        LocalDate today = LocalDate.now();
        var bookings = bookingRepository
                .findByVehicle_IdAndEndDateBeforeOrderByEndDateDescBookingIdDesc(id, today)
                .stream().map(b -> new VehicleBookingHistoryResponse.PastBooking(
                        b.getBookingId(), b.getCustomerName(), b.getStartDate(), b.getEndDate(),
                        b.getBookingStatus(), b.getTotalAmount(), b.getPickupLocation(),
                        b.getDropoffLocation())).toList();
        return new VehicleBookingHistoryResponse(vehicle, today, bookings);
    }

    @Transactional
    public VehicleResponse createVehicleWithImages(VehicleRequest request,
            java.util.List<org.springframework.web.multipart.MultipartFile> files) {
        imageService.validateUploads(files);
        VehicleResponse created = createVehicle(request);
        if (files != null && !files.isEmpty()) imageService.addVehicleImages(created.getId(), files);
        return getVehicleById(created.getId());
    }

    @Transactional
    public VehicleResponse createVehicle(VehicleRequest request) {
        String regNumber = request.getRegistrationNumber().trim().toUpperCase();

        if (vehicleRepository.existsByRegistrationNumberIgnoreCase(regNumber)) {
            throw new IllegalArgumentException("A vehicle with registration number '" + regNumber + "' already exists.");
        }

        VehicleOperationalStatus initialStatus = request.getOperationalStatus() != null ?
                request.getOperationalStatus() : VehicleOperationalStatus.AVAILABLE;

        Vehicle vehicle = Vehicle.builder()
                .registrationNumber(regNumber)
                .vehicleType(request.getVehicleType())
                .brand(request.getBrand().trim())
                .model(request.getModel().trim())
                .seatingCapacity(request.getSeatingCapacity())
                .rentalRate(request.getRentalRate())
                .mileage(request.getMileage())
                .fuelLevel(request.getFuelLevel())
                .condition(request.getCondition())
                .insurancePolicyNumber(request.getInsurancePolicyNumber().trim())
                .insuranceExpiryDate(request.getInsuranceExpiryDate())
                .licenseNumber(request.getLicenseNumber().trim())
                .licenseExpiryDate(request.getLicenseExpiryDate())
                .operationalStatus(initialStatus)
                .active(true)
                .build();

        Vehicle saved = vehicleRepository.save(vehicle);

        auditLogService.log("VEHICLE_CREATED", "VEHICLE", String.valueOf(saved.getId()),
                "Added vehicle: " + saved.getBrand() + " " + saved.getModel() + " [" + saved.getRegistrationNumber() + "]", null);

        return mapToResponse(saved);
    }

    public Page<VehicleResponse> listVehicles(String query,
                                             VehicleOperationalStatus status,
                                             VehicleType vehicleType,
                                             Boolean active,
                                             int page,
                                             int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Vehicle> vehicles = vehicleRepository.searchVehicles(query, status, vehicleType, active, pageRequest);
        return vehicles.map(this::mapToResponse);
    }

    public VehicleResponse getVehicleById(Long id) {
        return mapToResponse(getVehicleOrThrow(id));
    }

    @Transactional
    public VehicleResponse updateVehicle(Long id, VehicleRequest request) {
        Vehicle vehicle = getVehicleOrThrow(id);
        String regNumber = request.getRegistrationNumber().trim().toUpperCase();

        if (vehicleRepository.existsByRegistrationNumberIgnoreCaseAndIdNot(regNumber, id)) {
            throw new IllegalArgumentException("Another vehicle with registration number '" + regNumber + "' already exists.");
        }

        vehicle.setRegistrationNumber(regNumber);
        vehicle.setVehicleType(request.getVehicleType());
        vehicle.setBrand(request.getBrand().trim());
        vehicle.setModel(request.getModel().trim());
        vehicle.setSeatingCapacity(request.getSeatingCapacity());
        vehicle.setRentalRate(request.getRentalRate());
        vehicle.setMileage(request.getMileage());
        vehicle.setFuelLevel(request.getFuelLevel());
        vehicle.setCondition(request.getCondition());
        vehicle.setInsurancePolicyNumber(request.getInsurancePolicyNumber().trim());
        vehicle.setInsuranceExpiryDate(request.getInsuranceExpiryDate());
        vehicle.setLicenseNumber(request.getLicenseNumber().trim());
        vehicle.setLicenseExpiryDate(request.getLicenseExpiryDate());

        if (request.getOperationalStatus() != null) {
            vehicle.setOperationalStatus(request.getOperationalStatus());
        }

        Vehicle updated = vehicleRepository.save(vehicle);

        auditLogService.log("VEHICLE_UPDATED", "VEHICLE", String.valueOf(updated.getId()),
                "Updated details for vehicle [" + updated.getRegistrationNumber() + "]", null);

        return mapToResponse(updated);
    }

    @Transactional
    public VehicleResponse deactivateVehicle(Long id) {
        Vehicle vehicle = getVehicleOrThrow(id);

        if (vehicle.getOperationalStatus() == VehicleOperationalStatus.RENTED) {
            throw new IllegalStateException("Cannot deactivate vehicle while it is actively RENTED. Complete return first.");
        }

        if (bookingRepository.existsByVehicle_IdAndBookingStatusNot(id,
                com.sliit.vehiclerental.booking.entity.BookingStatus.CANCELLED)) {
            throw new IllegalStateException("Cancel active bookings before deactivating this vehicle.");
        }
        vehicle.setActive(false);
        Vehicle saved = vehicleRepository.save(vehicle);

        auditLogService.log("VEHICLE_DEACTIVATED", "VEHICLE", String.valueOf(saved.getId()),
                "Soft-deleted/deactivated vehicle [" + saved.getRegistrationNumber() + "]", null);

        return mapToResponse(saved);
    }

    @Transactional
    public VehicleResponse reactivateVehicle(Long id) {
        Vehicle vehicle = getVehicleOrThrow(id);
        vehicle.setActive(true);
        Vehicle saved = vehicleRepository.save(vehicle);

        auditLogService.log("VEHICLE_REACTIVATED", "VEHICLE", String.valueOf(saved.getId()),
                "Reactivated vehicle [" + saved.getRegistrationNumber() + "]", null);

        return mapToResponse(saved);
    }

    @Transactional
    public void deleteVehiclePermanently(Long id) {
        Vehicle vehicle = getVehicleOrThrow(id);

        if (vehicle.getOperationalStatus() == VehicleOperationalStatus.RENTED) {
            throw new IllegalStateException("Cannot permanently delete vehicle while it is actively RENTED. Complete return first.");
        }

        if (vehicle.getOperationalStatus() == VehicleOperationalStatus.RESERVED) {
            throw new IllegalStateException("Cannot permanently delete vehicle while it is RESERVED for an upcoming booking. Cancel the reservation first.");
        }

        String regNum = vehicle.getRegistrationNumber();
        String vehicleInfo = vehicle.getBrand() + " " + vehicle.getModel() + " [" + regNum + "]";

        if (bookingRepository.existsByVehicle_Id(id) || inspectionRepository.existsByVehicle_Id(id)) {
            throw new IllegalStateException("Vehicle has booking or inspection history. Deactivate it instead.");
        }
        imageService.removeForVehicle(id);
        vehicleRepository.delete(vehicle);

        auditLogService.log("VEHICLE_PERMANENTLY_DELETED", "VEHICLE", String.valueOf(id),
                "Permanently deleted vehicle: " + vehicleInfo, null);
    }

    @Transactional
    public VehicleResponse updateOperationalStatus(Long id, VehicleStatusUpdateRequest request) {
        Vehicle vehicle = getVehicleOrThrow(id);
        VehicleOperationalStatus oldStatus = vehicle.getOperationalStatus();
        VehicleOperationalStatus newStatus = request.getStatus();

        validateStatusTransition(oldStatus, newStatus);

        vehicle.setOperationalStatus(newStatus);
        Vehicle saved = vehicleRepository.save(vehicle);

        String detail = "Status changed: " + oldStatus + " -> " + newStatus +
                (request.getReason() != null && !request.getReason().isBlank() ? " (Reason: " + request.getReason() + ")" : "");
        auditLogService.log("VEHICLE_STATUS_UPDATED", "VEHICLE", String.valueOf(saved.getId()), detail, null);

        return mapToResponse(saved);
    }

    public FleetDashboardDto getDashboardStats() {
        long total = vehicleRepository.count();
        long available = vehicleRepository.countByOperationalStatus(VehicleOperationalStatus.AVAILABLE);
        long reserved = vehicleRepository.countByOperationalStatus(VehicleOperationalStatus.RESERVED);
        long rented = vehicleRepository.countByOperationalStatus(VehicleOperationalStatus.RENTED);
        long maintenance = vehicleRepository.countByOperationalStatus(VehicleOperationalStatus.MAINTENANCE);
        long outOfService = vehicleRepository.countByOperationalStatus(VehicleOperationalStatus.OUT_OF_SERVICE);

        long activeCount = vehicleRepository.countByActiveTrue();
        long deactivated = total - activeCount;

        List<RenewalAlertDto> alerts = getRenewalAlerts();

        return FleetDashboardDto.builder()
                .totalVehicles(total)
                .availableVehicles(available)
                .reservedVehicles(reserved)
                .rentedVehicles(rented)
                .maintenanceVehicles(maintenance)
                .outOfServiceVehicles(outOfService)
                .deactivatedVehicles(deactivated)
                .documentsRequiringAttentionCount(alerts.size())
                .alerts(alerts)
                .build();
    }

    public List<RenewalAlertDto> getRenewalAlerts() {
        LocalDate cutoff = LocalDate.now().plusDays(renewalWarningDays);
        List<Vehicle> vehicles = vehicleRepository.findVehiclesWithRenewalsDue(cutoff);
        List<RenewalAlertDto> alerts = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (Vehicle v : vehicles) {
            // Insurance check
            Long insDays = v.getInsuranceExpiryDate() == null ? null : ChronoUnit.DAYS.between(today, v.getInsuranceExpiryDate());
            if (insDays == null || insDays <= renewalWarningDays) {
                alerts.add(RenewalAlertDto.builder()
                        .vehicleId(v.getId())
                        .registrationNumber(v.getRegistrationNumber())
                        .brand(v.getBrand())
                        .model(v.getModel())
                        .documentType("INSURANCE")
                        .documentNumber(v.getInsurancePolicyNumber())
                        .expiryDate(v.getInsuranceExpiryDate())
                        .daysRemaining(insDays)
                        .alertSeverity(insDays == null ? "MISSING" : (insDays < 0 ? "EXPIRED" : "EXPIRING_SOON"))
                        .build());
            }

            // License check
            Long licDays = v.getLicenseExpiryDate() == null ? null : ChronoUnit.DAYS.between(today, v.getLicenseExpiryDate());
            if (licDays == null || licDays <= renewalWarningDays) {
                alerts.add(RenewalAlertDto.builder()
                        .vehicleId(v.getId())
                        .registrationNumber(v.getRegistrationNumber())
                        .brand(v.getBrand())
                        .model(v.getModel())
                        .documentType("LICENSE")
                        .documentNumber(v.getLicenseNumber())
                        .expiryDate(v.getLicenseExpiryDate())
                        .daysRemaining(licDays)
                        .alertSeverity(licDays == null ? "MISSING" : (licDays < 0 ? "EXPIRED" : "EXPIRING_SOON"))
                        .build());
            }
        }

        alerts.sort(java.util.Comparator.comparing(RenewalAlertDto::getDaysRemaining, java.util.Comparator.nullsFirst(Long::compareTo)));
        return alerts;
    }

    // --- Integration Interface Implementation (VehicleStatusService) ---

    @Override
    public boolean isVehicleAvailableForBooking(Long vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .map(v -> v.isActive() && v.getOperationalStatus() == VehicleOperationalStatus.AVAILABLE)
                .orElse(false);
    }

    @Override
    public Vehicle getVehicleOrThrow(Long vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with ID: " + vehicleId));
    }

    @Override
    @Transactional
    public void setVehicleReserved(Long vehicleId, String bookingReference) {
        Vehicle vehicle = getVehicleOrThrow(vehicleId);
        if (!vehicle.isActive() || vehicle.getOperationalStatus() != VehicleOperationalStatus.AVAILABLE) {
            throw new IllegalStateException("Vehicle is not available for reservation");
        }
        vehicle.setOperationalStatus(VehicleOperationalStatus.RESERVED);
        vehicleRepository.save(vehicle);
        auditLogService.log("VEHICLE_RESERVED", "VEHICLE", String.valueOf(vehicleId),
                "Vehicle reserved for booking: " + bookingReference, null);
    }

    @Override
    @Transactional
    public void setVehicleRented(Long vehicleId, String bookingReference) {
        Vehicle vehicle = getVehicleOrThrow(vehicleId);
        if (vehicle.getOperationalStatus() != VehicleOperationalStatus.RESERVED) {
            throw new IllegalStateException("Vehicle must be in RESERVED status to start rental");
        }
        vehicle.setOperationalStatus(VehicleOperationalStatus.RENTED);
        vehicleRepository.save(vehicle);
        auditLogService.log("VEHICLE_RENTED", "VEHICLE", String.valueOf(vehicleId),
                "Handover completed, rental active for: " + bookingReference, null);
    }

    @Override
    @Transactional
    public void setVehicleAvailable(Long vehicleId, String reason) {
        Vehicle vehicle = getVehicleOrThrow(vehicleId);
        vehicle.setOperationalStatus(VehicleOperationalStatus.AVAILABLE);
        vehicleRepository.save(vehicle);
        auditLogService.log("VEHICLE_MADE_AVAILABLE", "VEHICLE", String.valueOf(vehicleId),
                "Vehicle returned to AVAILABLE status: " + reason, null);
    }

    @Override
    @Transactional
    public void setVehicleMaintenance(Long vehicleId, String reason) {
        Vehicle vehicle = getVehicleOrThrow(vehicleId);
        vehicle.setOperationalStatus(VehicleOperationalStatus.MAINTENANCE);
        vehicleRepository.save(vehicle);
        auditLogService.log("VEHICLE_SENT_TO_MAINTENANCE", "VEHICLE", String.valueOf(vehicleId),
                "Vehicle flagged for maintenance: " + reason, null);
    }

    @Override
    @Transactional
    public void setVehicleOutOfService(Long vehicleId, String reason) {
        Vehicle vehicle = getVehicleOrThrow(vehicleId);
        vehicle.setOperationalStatus(VehicleOperationalStatus.OUT_OF_SERVICE);
        vehicleRepository.save(vehicle);
        auditLogService.log("VEHICLE_OUT_OF_SERVICE", "VEHICLE", String.valueOf(vehicleId),
                "Vehicle marked OUT_OF_SERVICE: " + reason, null);
    }

    @Override
    @Transactional
    public void updateInspectionResults(Long vehicleId,
                                        Double mileage,
                                        Integer fuelLevel,
                                        VehicleCondition condition,
                                        VehicleOperationalStatus status,
                                        String auditNotes) {
        Vehicle vehicle = getVehicleOrThrow(vehicleId);
        vehicle.setMileage(mileage);
        vehicle.setFuelLevel(fuelLevel);
        vehicle.setCondition(condition);
        vehicle.setOperationalStatus(status);
        vehicleRepository.save(vehicle);

        auditLogService.log("VEHICLE_INSPECTION_APPLIED", "VEHICLE", String.valueOf(vehicleId),
                "Post-inspection updates applied: Status=" + status + ", Mileage=" + mileage +
                        ", Fuel=" + fuelLevel + "%, Condition=" + condition + " | " + auditNotes, null);
    }

    private void validateStatusTransition(VehicleOperationalStatus oldStatus, VehicleOperationalStatus newStatus) {
        if (oldStatus == newStatus) return;

        // Allow reasonable operational transitions
        if (oldStatus == VehicleOperationalStatus.RENTED && newStatus == VehicleOperationalStatus.RESERVED) {
            throw new IllegalStateException("A rented vehicle cannot transition directly to RESERVED without being returned/inspected.");
        }


    }

    private VehicleResponse mapToResponse(Vehicle v) {
        LocalDate today = LocalDate.now();

        Long insDays = v.getInsuranceExpiryDate() == null ? null : ChronoUnit.DAYS.between(today, v.getInsuranceExpiryDate());
        String insStatus = insDays == null ? "MISSING" : insDays < 0 ? "EXPIRED" : (insDays <= renewalWarningDays ? "EXPIRING_SOON" : "VALID");

        Long licDays = v.getLicenseExpiryDate() == null ? null : ChronoUnit.DAYS.between(today, v.getLicenseExpiryDate());
        String licStatus = licDays == null ? "MISSING" : licDays < 0 ? "EXPIRED" : (licDays <= renewalWarningDays ? "EXPIRING_SOON" : "VALID");

        return VehicleResponse.builder()
                .id(v.getId())
                .images(imageService.vehicleImages(v.getId()))
                .registrationNumber(v.getRegistrationNumber())
                .vehicleType(v.getVehicleType())
                .brand(v.getBrand())
                .model(v.getModel())
                .seatingCapacity(v.getSeatingCapacity())
                .rentalRate(v.getRentalRate())
                .mileage(v.getMileage())
                .fuelLevel(v.getFuelLevel())
                .condition(v.getCondition())
                .insurancePolicyNumber(v.getInsurancePolicyNumber())
                .insuranceExpiryDate(v.getInsuranceExpiryDate())
                .insuranceStatus(insStatus)
                .insuranceDaysUntilExpiry(insDays)
                .licenseNumber(v.getLicenseNumber())
                .licenseExpiryDate(v.getLicenseExpiryDate())
                .licenseStatus(licStatus)
                .licenseDaysUntilExpiry(licDays)
                .operationalStatus(v.getOperationalStatus())
                .active(v.isActive())
                .createdAt(v.getCreatedAt())
                .updatedAt(v.getUpdatedAt())
                .build();
    }
}
