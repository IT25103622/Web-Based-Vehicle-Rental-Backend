package com.sliit.vehiclerental.vehicle.repository;

import com.sliit.vehiclerental.vehicle.entity.OperationalStatus;
import com.sliit.vehiclerental.vehicle.entity.Vehicle;
import com.sliit.vehiclerental.vehicle.entity.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);

    List<Vehicle> findByOperationalStatus(OperationalStatus operationalStatus);

    @Query("SELECT v FROM Vehicle v WHERE " +
           "(:vehicleType IS NULL OR v.vehicleType = :vehicleType) AND " +
           "(:maxPrice IS NULL OR v.rentalRate <= :maxPrice)")
    List<Vehicle> findVehiclesWithFilters(@Param("vehicleType") VehicleType vehicleType,
                                         @Param("maxPrice") BigDecimal maxPrice);
}
