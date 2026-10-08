package com.sliit.vehiclerental.fleet.dto;

import com.sliit.vehiclerental.booking.entity.BookingStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record VehicleBookingHistoryResponse(VehicleResponse vehicle, LocalDate asOfDate,
                                           List<PastBooking> bookings) {
    public record PastBooking(Long bookingId, String customerName, LocalDate startDate,
                              LocalDate endDate, BookingStatus bookingStatus, BigDecimal totalAmount,
                              String pickupLocation, String dropoffLocation) {}
}
