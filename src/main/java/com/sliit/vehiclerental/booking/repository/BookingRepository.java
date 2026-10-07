package com.sliit.vehiclerental.booking.repository;

import com.sliit.vehiclerental.booking.entity.Booking;
import com.sliit.vehiclerental.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByCustomer_IdOrderByCreatedAtDesc(Long customerId);

    List<Booking> findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(String customerEmail);

    List<Booking> findByVehicle_VehicleIdAndBookingStatusNot(Long vehicleId, BookingStatus status);

    /**
     * Date overlap check:
     * An active booking overlaps when:
     * existing.startDate < requested.endDate AND existing.endDate > requested.startDate
     * Cancelled bookings (excludedStatus = CANCELLED) are ignored.
     */
    @Query("SELECT b FROM Booking b WHERE b.vehicle.vehicleId = :vehicleId " +
           "AND b.bookingStatus != :excludedStatus " +
           "AND b.startDate < :endDate " +
           "AND b.endDate > :startDate")
    List<Booking> findOverlappingBookings(@Param("vehicleId") Long vehicleId,
                                         @Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate,
                                         @Param("excludedStatus") BookingStatus excludedStatus);

    /**
     * Date overlap check excluding a specific booking (used when modifying an existing booking).
     */
    @Query("SELECT b FROM Booking b WHERE b.vehicle.vehicleId = :vehicleId " +
           "AND b.bookingId != :excludeBookingId " +
           "AND b.bookingStatus != :excludedStatus " +
           "AND b.startDate < :endDate " +
           "AND b.endDate > :startDate")
    List<Booking> findOverlappingBookingsExcluding(@Param("vehicleId") Long vehicleId,
                                                  @Param("excludeBookingId") Long excludeBookingId,
                                                  @Param("startDate") LocalDate startDate,
                                                  @Param("endDate") LocalDate endDate,
                                                  @Param("excludedStatus") BookingStatus excludedStatus);

    long countByBookingStatus(BookingStatus status);

    long countByBookingStatusNot(BookingStatus status);
}
