package com.sliit.vehiclerental.booking.dto;

import com.sliit.vehiclerental.booking.entity.Booking;
import com.sliit.vehiclerental.booking.entity.BookingStatus;
import com.sliit.vehiclerental.fleet.entity.VehicleType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class BookingResponseDTO {

    private Long bookingId;
    private Long customerId;
    private Long vehicleId;
    private String vehicleName;
    private String vehicleRegistration;
    private VehicleType vehicleType;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String pickupLocation;
    private String dropoffLocation;
    private LocalDate startDate;
    private LocalDate endDate;
    private long rentalDays;
    private BigDecimal rentalRate;
    private BigDecimal totalAmount;
    private String comment;
    private BookingStatus bookingStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BookingResponseDTO fromEntity(Booking booking) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.bookingId = booking.getBookingId();

        if (booking.getCustomer() != null) {
            dto.customerId = booking.getCustomer().getId();
        }

        if (booking.getVehicle() != null) {
            dto.vehicleId = booking.getVehicle().getId();
            dto.vehicleName = booking.getVehicle().getBrand() + " " + booking.getVehicle().getModel();
            dto.vehicleRegistration = booking.getVehicle().getRegistrationNumber();
            dto.vehicleType = booking.getVehicle().getVehicleType();
            dto.rentalRate = booking.getVehicle().getRentalRate();
        }

        dto.customerName = booking.getCustomerName();
        dto.customerEmail = booking.getCustomerEmail();
        dto.customerPhone = booking.getCustomerPhone();
        dto.pickupLocation = booking.getPickupLocation();
        dto.dropoffLocation = booking.getDropoffLocation();
        dto.startDate = booking.getStartDate();
        dto.endDate = booking.getEndDate();

        long days = ChronoUnit.DAYS.between(booking.getStartDate(), booking.getEndDate());
        dto.rentalDays = days <= 0 ? 1 : days;
        dto.totalAmount = booking.getTotalAmount();
        dto.comment = booking.getComment();
        dto.bookingStatus = booking.getBookingStatus();
        dto.createdAt = booking.getCreatedAt();
        dto.updatedAt = booking.getUpdatedAt();

        return dto;
    }

    public Long getBookingId() { return bookingId; }
    public Long getCustomerId() { return customerId; }
    public Long getVehicleId() { return vehicleId; }
    public String getVehicleName() { return vehicleName; }
    public String getVehicleRegistration() { return vehicleRegistration; }
    public VehicleType getVehicleType() { return vehicleType; }
    public String getCustomerName() { return customerName; }
    public String getCustomerEmail() { return customerEmail; }
    public String getCustomerPhone() { return customerPhone; }
    public String getPickupLocation() { return pickupLocation; }
    public String getDropoffLocation() { return dropoffLocation; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public long getRentalDays() { return rentalDays; }
    public BigDecimal getRentalRate() { return rentalRate; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getComment() { return comment; }
    public BookingStatus getBookingStatus() { return bookingStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
