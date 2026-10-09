package com.sliit.vehiclerental.booking.service;

import com.sliit.vehiclerental.booking.dto.BookingRequestDTO;
import com.sliit.vehiclerental.booking.dto.BookingResponseDTO;
import com.sliit.vehiclerental.booking.dto.BookingUpdateDTO;
import com.sliit.vehiclerental.booking.entity.Booking;
import com.sliit.vehiclerental.booking.entity.BookingStatus;
import com.sliit.vehiclerental.booking.repository.BookingRepository;
import com.sliit.vehiclerental.customer.entity.CustomerUser;
import com.sliit.vehiclerental.customer.repository.CustomerUserRepository;
import com.sliit.vehiclerental.fleet.entity.Vehicle;
import com.sliit.vehiclerental.fleet.entity.VehicleOperationalStatus;
import com.sliit.vehiclerental.fleet.repository.VehicleRepository;
import com.sliit.vehiclerental.fleet.service.VehicleStatusService;
import com.sliit.vehiclerental.pricing.dto.EvaluatePromotionRequest;
import com.sliit.vehiclerental.pricing.dto.PromotionEvaluationResult;
import com.sliit.vehiclerental.pricing.service.PromotionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final VehicleStatusService vehicleStatusService;
    private final PromotionService promotionService;

    public BookingService(BookingRepository bookingRepository,
                          VehicleRepository vehicleRepository,
                          CustomerUserRepository customerUserRepository,
                          VehicleStatusService vehicleStatusService,
                          PromotionService promotionService) {
        this.bookingRepository = bookingRepository;
        this.vehicleRepository = vehicleRepository;
        this.customerUserRepository = customerUserRepository;
        this.vehicleStatusService = vehicleStatusService;
        this.promotionService = promotionService;
    }

    /**
     * CREATE: Create a new booking linked securely to the authenticated customer's users.id.
     * Prevents client spoofing of customerId.
     */
    public BookingResponseDTO createBooking(BookingRequestDTO request, Long authenticatedUserId) {
        if (authenticatedUserId == null) {
            throw new IllegalArgumentException("Customer must be authenticated to create a booking.");
        }

        CustomerUser customer = customerUserRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Customer account not found with ID: " + authenticatedUserId));

        if ("DEACTIVATED".equalsIgnoreCase(customer.getStatus())) {
            throw new IllegalStateException("Your customer account is deactivated. Please contact support.");
        }

        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Both pickup date and drop-off date are required.");
        }
        if (!request.getEndDate().isAfter(request.getStartDate())) {
            throw new IllegalArgumentException("Drop-off date must be after pickup date.");
        }

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found with ID: " + request.getVehicleId()));

        if (!vehicle.isActive() || vehicle.getOperationalStatus() != VehicleOperationalStatus.AVAILABLE) {
            throw new IllegalStateException("Vehicle cannot be booked because it is currently " + vehicle.getOperationalStatus());
        }

        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                vehicle.getId(), request.getStartDate(), request.getEndDate(), BookingStatus.CANCELLED);

        if (!overlapping.isEmpty()) {
            Booking clash = overlapping.get(0);
            throw new IllegalStateException(
                    "This vehicle is no longer available for the selected dates (" +
                            request.getStartDate() + " to " + request.getEndDate() +
                            "). It is already booked from " + clash.getStartDate() + " to " + clash.getEndDate() + ".");
        }

        long rentalDays = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());
        if (rentalDays <= 0) {
            rentalDays = 1;
        }
        BigDecimal totalAmount = vehicle.getRentalRate().multiply(BigDecimal.valueOf(rentalDays));

        // Apply the best active promotion (same rules as the Pricing evaluator).
        PromotionEvaluationResult promo = evaluatePromotion(vehicle, request.getStartDate(), request.getEndDate());
        boolean promoApplied = promo.getAppliedPromotion() != null && promo.getDiscountAmount() > 0;
        if (promoApplied) {
            totalAmount = BigDecimal.valueOf(promo.getFinalAmount()).setScale(2, RoundingMode.HALF_UP);
        }

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

        if (promoApplied) {
            promotionService.recordUsage(promo.getAppliedPromotion().getId(), BigDecimal.valueOf(promo.getDiscountAmount()));
        }

        // Cross-module integration (Fleet, UC-03): flip the vehicle to
        // RESERVED so Fleet/Manager dashboards reflect the new booking
        // immediately, via the contract Fleet exposes for this purpose.
        vehicleStatusService.setVehicleReserved(vehicle.getId(), "BOOKING-" + savedBooking.getBookingId());

        return BookingResponseDTO.fromEntity(savedBooking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getBookingsByCustomerId(Long customerId) {
        return bookingRepository.findByCustomer_IdOrderByCreatedAtDesc(customerId).stream()
                .map(BookingResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(BookingResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + id));
        return BookingResponseDTO.fromEntity(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getBookingsByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return getAllBookings();
        }
        return bookingRepository.findByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(email.trim()).stream()
                .map(BookingResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public BookingResponseDTO modifyBooking(Long bookingId, BookingUpdateDTO updateDTO) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + bookingId));

        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Cannot modify a cancelled booking.");
        }

        if (!updateDTO.getEndDate().isAfter(updateDTO.getStartDate())) {
            throw new IllegalArgumentException("Drop-off date must be after pickup date.");
        }

        List<Booking> overlapping = bookingRepository.findOverlappingBookingsExcluding(
                booking.getVehicle().getId(),
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

        long rentalDays = ChronoUnit.DAYS.between(updateDTO.getStartDate(), updateDTO.getEndDate());
        if (rentalDays <= 0) {
            rentalDays = 1;
        }
        BigDecimal totalAmount = booking.getVehicle().getRentalRate().multiply(BigDecimal.valueOf(rentalDays));
        PromotionEvaluationResult updatePromo =
                evaluatePromotion(booking.getVehicle(), updateDTO.getStartDate(), updateDTO.getEndDate());
        if (updatePromo.getAppliedPromotion() != null && updatePromo.getDiscountAmount() > 0) {
            totalAmount = BigDecimal.valueOf(updatePromo.getFinalAmount()).setScale(2, RoundingMode.HALF_UP);
        }

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
     * DELETE (Soft-delete): Cancel booking by updating status to CANCELLED,
     * and release the vehicle back to AVAILABLE if nothing else holds it.
     */
    public BookingResponseDTO cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + bookingId));

        booking.setBookingStatus(BookingStatus.CANCELLED);
        Booking cancelledBooking = bookingRepository.save(booking);

        Vehicle vehicle = cancelledBooking.getVehicle();
        if (vehicle != null && vehicle.getOperationalStatus() == VehicleOperationalStatus.RESERVED) {
            vehicleStatusService.setVehicleAvailable(vehicle.getId(), "Booking #" + bookingId + " cancelled");
        }

        return BookingResponseDTO.fromEntity(cancelledBooking);
    }

    private PromotionEvaluationResult evaluatePromotion(Vehicle vehicle, LocalDate start, LocalDate end) {
        EvaluatePromotionRequest req = new EvaluatePromotionRequest();
        req.setVehicleId(vehicle.getId());
        req.setPickupDate(start);
        req.setReturnDate(end);
        return promotionService.evaluatePromotionForBooking(req);
    }
}