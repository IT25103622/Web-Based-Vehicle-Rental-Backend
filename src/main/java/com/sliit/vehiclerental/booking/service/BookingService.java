package com.sliit.vehiclerental.booking.service;

import com.sliit.vehiclerental.booking.dto.BookingRequestDTO;
import com.sliit.vehiclerental.booking.dto.BookingResponseDTO;
import com.sliit.vehiclerental.booking.dto.BookingUpdateDTO;
import com.sliit.vehiclerental.booking.entity.Booking;
import com.sliit.vehiclerental.booking.entity.BookingStatus;
import com.sliit.vehiclerental.booking.repository.BookingRepository;
import com.sliit.vehiclerental.customer.entity.CustomerUser;
import com.sliit.vehiclerental.customer.repository.CustomerUserRepository;
import com.sliit.vehiclerental.vehicle.entity.OperationalStatus;
import com.sliit.vehiclerental.vehicle.entity.Vehicle;
import com.sliit.vehiclerental.vehicle.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final CustomerUserRepository customerUserRepository;

    public BookingService(BookingRepository bookingRepository,
                          VehicleRepository vehicleRepository,
                          CustomerUserRepository customerUserRepository) {
        this.bookingRepository = bookingRepository;
        this.vehicleRepository = vehicleRepository;
        this.customerUserRepository = customerUserRepository;
    }

    /**
     * CREATE: Create a new booking linked securely to the authenticated customer's users.id.
     * Prevents client spoofing of customerId.
     */
    public BookingResponseDTO createBooking(BookingRequestDTO request, Long authenticatedUserId) {
        if (authenticatedUserId == null) {
            throw new IllegalArgumentException("Customer must be authenticated to create a booking.");
        }

        // 1. Fetch Customer Account from central users table
        CustomerUser customer = customerUserRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Customer account not found with ID: " + authenticatedUserId));

        if ("DEACTIVATED".equalsIgnoreCase(customer.getStatus())) {
            throw new IllegalStateException("Your customer account is deactivated. Please contact support.");
        }

        // 2. Date validation
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Both pickup date and drop-off date are required.");
        }
        if (!request.getEndDate().isAfter(request.getStartDate())) {
            throw new IllegalArgumentException("Drop-off date must be after pickup date.");
        }

        // 3. Fetch Vehicle
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found with ID: " + request.getVehicleId()));

        // 4. Operational status check
        if (vehicle.getOperationalStatus() != OperationalStatus.AVAILABLE) {
            throw new IllegalStateException("Vehicle cannot be booked because it is currently " + vehicle.getOperationalStatus());
        }

        // 5. Double-Booking Prevention: Mandatory overlap check on Java backend
        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                vehicle.getVehicleId(), request.getStartDate(), request.getEndDate(), BookingStatus.CANCELLED);

        if (!overlapping.isEmpty()) {
            Booking clash = overlapping.get(0);
            throw new IllegalStateException(
                    "This vehicle is no longer available for the selected dates (" +
                    request.getStartDate() + " to " + request.getEndDate() +
                    "). It is already booked from " + clash.getStartDate() + " to " + clash.getEndDate() + ".");
        }

        // 6. Calculate rental duration and total price
        long rentalDays = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());
        if (rentalDays <= 0) {
            rentalDays = 1;
        }
        BigDecimal totalAmount = vehicle.getRentalRate().multiply(BigDecimal.valueOf(rentalDays));

        // 7. Build and save new booking with authenticated customer information
        Booking booking = new Booking();
        booking.setCustomer(customer);
        booking.setVehicle(vehicle);
        booking.setCustomerName(customer.getFullName());
        booking.setCustomerEmail(customer.getEmail());
        booking.setCustomerPhone(customer.getPhone() != null ? customer.getPhone().trim() : "");
        booking.setPickupLocation(request.getPickupLocation().trim());
        booking.setDropoffLocation(request.getDropoffLocation().trim());
        booking.setStartDate(request.getStartDate());
        booking.setEndDate(request.getEndDate());
        booking.setTotalAmount(totalAmount);
        booking.setComment(request.getComment() != null ? request.getComment().trim() : null);
        booking.setBookingStatus(BookingStatus.CONFIRMED);

        Booking savedBooking = bookingRepository.save(booking);
        return BookingResponseDTO.fromEntity(savedBooking);
    }

    /**
     * READ: Get bookings placed by a specific customer ID.
     */
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getBookingsByCustomerId(Long customerId) {
        return bookingRepository.findByCustomer_IdOrderByCreatedAtDesc(customerId).stream()
                .map(BookingResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * READ: Get all bookings (ordered by newest first).
     */
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(BookingResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * READ: Get booking by ID.
     */
    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + id));
        return BookingResponseDTO.fromEntity(booking);
    }

    /**
     * READ: Get customer bookings by email.
     */
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getBookingsByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return getAllBookings();
        }
        return bookingRepository.findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(email.trim()).stream()
                .map(BookingResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * UPDATE: Modify existing booking dates and locations with overlap re-check.
     */
    public BookingResponseDTO modifyBooking(Long bookingId, BookingUpdateDTO updateDTO) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + bookingId));

        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Cannot modify a cancelled booking.");
        }

        if (!updateDTO.getEndDate().isAfter(updateDTO.getStartDate())) {
            throw new IllegalArgumentException("Drop-off date must be after pickup date.");
        }

        // Re-check availability for the modified dates, excluding THIS booking from collision check
        List<Booking> overlapping = bookingRepository.findOverlappingBookingsExcluding(
                booking.getVehicle().getVehicleId(),
                bookingId,
                updateDTO.getStartDate(),
                updateDTO.getEndDate(),
                BookingStatus.CANCELLED);

        if (!overlapping.isEmpty()) {
            Booking clash = overlapping.get(0);
            throw new IllegalStateException(
                    "Vehicle is not available for the updated dates (" +
                    updateDTO.getStartDate() + " to " + updateDTO.getEndDate() +
                    "). Another booking exists from " + clash.getStartDate() + " to " + clash.getEndDate() + ".");
        }

        // Recalculate duration and amount
        long rentalDays = ChronoUnit.DAYS.between(updateDTO.getStartDate(), updateDTO.getEndDate());
        if (rentalDays <= 0) {
            rentalDays = 1;
        }
        BigDecimal totalAmount = booking.getVehicle().getRentalRate().multiply(BigDecimal.valueOf(rentalDays));

        booking.setStartDate(updateDTO.getStartDate());
        booking.setEndDate(updateDTO.getEndDate());
        booking.setPickupLocation(updateDTO.getPickupLocation().trim());
        booking.setDropoffLocation(updateDTO.getDropoffLocation().trim());
        booking.setTotalAmount(totalAmount);
        booking.setBookingStatus(BookingStatus.MODIFIED);

        Booking updatedBooking = bookingRepository.save(booking);
        return BookingResponseDTO.fromEntity(updatedBooking);
    }

    /**
     * DELETE (Soft-delete): Cancel booking by updating status to CANCELLED.
     */
    public BookingResponseDTO cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + bookingId));

        booking.setBookingStatus(BookingStatus.CANCELLED);
        Booking cancelledBooking = bookingRepository.save(booking);
        return BookingResponseDTO.fromEntity(cancelledBooking);
    }
}
