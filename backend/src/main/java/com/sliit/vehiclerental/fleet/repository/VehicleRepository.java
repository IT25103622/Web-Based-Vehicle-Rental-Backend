package com.sliit.vehiclerental.fleet.repository;

import com.sliit.vehiclerental.fleet.entity.Vehicle;
import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;
import com.sliit.vehiclerental.fleet.entity.VehicleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select v from Vehicle v where v.id = :id")
    java.util.Optional<Vehicle> lockImageOwner(@org.springframework.data.repository.query.Param("id") Long id);


    Optional<Vehicle> findByRegistrationNumberIgnoreCase(String registrationNumber);

    boolean existsByRegistrationNumberIgnoreCase(String registrationNumber);

    boolean existsByRegistrationNumberIgnoreCaseAndIdNot(String registrationNumber, Long id);

    List<Vehicle> findByActiveTrue();

    long countByOperationalStatus(VehicleOperationalStatus status);

    long countByActiveTrue();

    @Query("SELECT v FROM Vehicle v WHERE " +
            "(:status IS NULL OR v.operationalStatus = :status) AND " +
            "(:vehicleType IS NULL OR v.vehicleType = :vehicleType) AND " +
            "(:active IS NULL OR v.active = :active) AND " +
            "(:query IS NULL OR :query = '' OR " +
            " LOWER(v.registrationNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            " LOWER(v.brand) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            " LOWER(v.model) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Vehicle> searchVehicles(
            @Param("query") String query,
            @Param("status") VehicleOperationalStatus status,
            @Param("vehicleType") VehicleType vehicleType,
            @Param("active") Boolean active,
            Pageable pageable);

    @Query("SELECT v FROM Vehicle v WHERE v.active = true AND (v.insuranceExpiryDate IS NULL OR v.licenseExpiryDate IS NULL OR v.insuranceExpiryDate <= :cutoffDate OR v.licenseExpiryDate <= :cutoffDate)")
    List<Vehicle> findVehiclesWithRenewalsDue(@Param("cutoffDate") LocalDate cutoffDate);

    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);

    List<Vehicle> findByOperationalStatus(VehicleOperationalStatus operationalStatus);

    @Query("SELECT v FROM Vehicle v WHERE v.active = true AND " +
           "(:vehicleType IS NULL OR v.vehicleType = :vehicleType) AND " +
           "(:maxPrice IS NULL OR v.rentalRate <= :maxPrice)")
    List<Vehicle> findVehiclesWithFilters(@Param("vehicleType") VehicleType vehicleType,
                                         @Param("maxPrice") BigDecimal maxPrice);
}
