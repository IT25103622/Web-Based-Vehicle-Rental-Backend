package com.sliit.vehiclerental.inspection.repository;

import com.sliit.vehiclerental.inspection.entity.InspectionType;
import com.sliit.vehiclerental.inspection.entity.VehicleInspection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehicleInspectionRepository extends JpaRepository<VehicleInspection, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select v from VehicleInspection v where v.id = :id")
    java.util.Optional<VehicleInspection> lockImageOwner(@org.springframework.data.repository.query.Param("id") Long id);


    List<VehicleInspection> findByVehicleIdOrderByInspectionDateDesc(Long vehicleId);

    Page<VehicleInspection> findAllByOrderByInspectionDateDesc(Pageable pageable);

    Optional<VehicleInspection> findTopByVehicleIdAndInspectionTypeOrderByInspectionDateDesc(
            Long vehicleId, InspectionType inspectionType);

    Optional<VehicleInspection> findTopByVehicleIdAndBookingReferenceAndInspectionType(
            Long vehicleId, String bookingReference, InspectionType inspectionType);
    boolean existsByVehicle_Id(Long vehicleId);
}
