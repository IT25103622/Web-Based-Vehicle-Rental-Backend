package com.sliit.vehiclerental.booking.controller;

import com.sliit.vehiclerental.booking.dto.BookingRequestDTO;
import com.sliit.vehiclerental.booking.dto.BookingResponseDTO;
import com.sliit.vehiclerental.booking.dto.BookingUpdateDTO;
import com.sliit.vehiclerental.booking.service.BookingService;
import com.sliit.vehiclerental.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /**
     * CREATE: Book a vehicle for the currently authenticated customer.
     * The customer ID is extracted securely from the JWT session.
     */
    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(
            @Valid @RequestBody BookingRequestDTO request,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (principal == null || principal.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        BookingResponseDTO created = bookingService.createBooking(request, principal.getId());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * READ: Get bookings.
     * Customers only see their own bookings.
     * Staff/Admin can view all or filter by customer email.
     */
    @GetMapping
    public ResponseEntity<List<BookingResponseDTO>> getBookings(
            @RequestParam(required = false) String email,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (principal == null || principal.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // If authenticated as regular customer, restrict strictly to their own bookings
        String role = principal.getRole();
        if (role == null || "CUSTOMER".equalsIgnoreCase(role) || "ROLE_CUSTOMER".equalsIgnoreCase(role)) {
            return ResponseEntity.ok(bookingService.getBookingsByCustomerId(principal.getId()));
        }

        // Staff / Admin / Manager roles can filter by email or list all
        if (email != null && !email.trim().isEmpty()) {
            return ResponseEntity.ok(bookingService.getBookingsByEmail(email));
        }
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    /**
     * READ: Get booking by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponseDTO> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    /**
     * UPDATE: Modify booking dates / locations.
     */
    @PutMapping("/{id}")
    public ResponseEntity<BookingResponseDTO> modifyBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingUpdateDTO updateDTO) {
        return ResponseEntity.ok(bookingService.modifyBooking(id, updateDTO));
    }

    /**
     * DELETE (Soft): Cancel booking.
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }
}
