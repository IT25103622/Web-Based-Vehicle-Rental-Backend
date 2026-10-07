package com.sliit.vehiclerental;

import com.sliit.vehiclerental.booking.dto.BookingRequestDTO;
import com.sliit.vehiclerental.booking.dto.BookingResponseDTO;
import com.sliit.vehiclerental.booking.dto.BookingUpdateDTO;
import com.sliit.vehiclerental.booking.entity.Booking;
import com.sliit.vehiclerental.booking.entity.BookingStatus;
import com.sliit.vehiclerental.booking.repository.BookingRepository;
import com.sliit.vehiclerental.booking.service.BookingService;
import com.sliit.vehiclerental.customer.entity.CustomerUser;
import com.sliit.vehiclerental.customer.repository.CustomerUserRepository;
import com.sliit.vehiclerental.vehicle.entity.OperationalStatus;
import com.sliit.vehiclerental.vehicle.entity.Vehicle;
import com.sliit.vehiclerental.vehicle.entity.VehicleType;
import com.sliit.vehiclerental.vehicle.repository.VehicleRepository;
import com.sliit.vehiclerental.vehicle.service.VehicleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class BookingAvailabilityTest {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CustomerUserRepository customerUserRepository;

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private BookingService bookingService;

    private Vehicle testVehicle;
    private CustomerUser testCustomer;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        vehicleRepository.deleteAll();
        customerUserRepository.deleteAll();

        // Create a test vehicle
        testVehicle = new Vehicle(
                null,
                "WP-CAB-9999",
                VehicleType.SEDAN,
                "Toyota",
                "Prius Test",
                5,
                new BigDecimal("8500.00"),
                30000,
                "100%",
                "Excellent",
                OperationalStatus.AVAILABLE,
                "https://images.unsplash.com/photo-1617814076367-b759c7d7e738",
                "Test vehicle description"
        );
        testVehicle = vehicleRepository.save(testVehicle);

        // Create a test customer account in users table
        testCustomer = new CustomerUser(
                null,
                "Kasun Perera",
                "kasun.perera@test.com",
                "+94 77 111 2233",
                "ACTIVE",
                "testpasswordhash"
        );
        testCustomer = customerUserRepository.save(testCustomer);
    }

    @Test
    @DisplayName("1. Vehicle Search: Should find available vehicles")
    void testVehicleSearch() {
        var results = vehicleService.searchVehicles(
                LocalDate.of(2026, 11, 1),
                LocalDate.of(2026, 11, 5),
                VehicleType.SEDAN,
                new BigDecimal("10000.00"),
                "Colombo"
        );

        assertFalse(results.isEmpty(), "Vehicle search should return matching vehicles");
        assertEquals("WP-CAB-9999", results.get(0).getRegistrationNumber());
        assertTrue(results.get(0).isAvailable());
    }

    @Test
    @DisplayName("2. Booking Creation: Successfully create a confirmed booking with customer ID & comment")
    void testCreateBookingSuccess() {
        BookingRequestDTO req = new BookingRequestDTO();
        req.setVehicleId(testVehicle.getVehicleId());
        req.setPickupLocation("Colombo Branch");
        req.setDropoffLocation("Colombo Branch");
        req.setStartDate(LocalDate.of(2026, 10, 10));
        req.setEndDate(LocalDate.of(2026, 10, 15));
        req.setComment("Please provide a child safety seat.");

        BookingResponseDTO res = bookingService.createBooking(req, testCustomer.getId());

        assertNotNull(res.getBookingId());
        assertEquals(testCustomer.getId(), res.getCustomerId());
        assertEquals("Kasun Perera", res.getCustomerName());
        assertEquals("kasun.perera@test.com", res.getCustomerEmail());
        assertEquals("+94 77 111 2233", res.getCustomerPhone());
        assertEquals("Please provide a child safety seat.", res.getComment());
        assertEquals(BookingStatus.CONFIRMED, res.getBookingStatus());
        assertEquals(5, res.getRentalDays());
        assertEquals(new BigDecimal("42500.00"), res.getTotalAmount());
    }

    @Test
    @DisplayName("3. Overlapping Booking Rejection: Prevent double booking")
    void testRejectOverlappingBooking() {
        // Book Oct 10 -> Oct 15
        Booking existing = new Booking(
                null,
                testCustomer,
                testVehicle,
                testCustomer.getFullName(),
                testCustomer.getEmail(),
                testCustomer.getPhone(),
                "Colombo",
                "Colombo",
                LocalDate.of(2026, 10, 10),
                LocalDate.of(2026, 10, 15),
                new BigDecimal("42500.00"),
                "First booking",
                BookingStatus.CONFIRMED
        );
        bookingRepository.save(existing);

        // Attempt Oct 12 -> Oct 14 (overlap)
        BookingRequestDTO clashReq = new BookingRequestDTO();
        clashReq.setVehicleId(testVehicle.getVehicleId());
        clashReq.setPickupLocation("Colombo");
        clashReq.setDropoffLocation("Colombo");
        clashReq.setStartDate(LocalDate.of(2026, 10, 12));
        clashReq.setEndDate(LocalDate.of(2026, 10, 14));
        clashReq.setComment("Second booking attempt");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            bookingService.createBooking(clashReq, testCustomer.getId());
        });

        assertTrue(ex.getMessage().contains("no longer available"),
                "Double booking must be prevented with clear message");
    }

    @Test
    @DisplayName("4. Non-Overlapping Adjacent Dates: Booking is allowed")
    void testAdjacentBookingAllowed() {
        // Existing: Oct 10 -> Oct 15
        Booking existing = new Booking(
                null,
                testCustomer,
                testVehicle,
                testCustomer.getFullName(),
                testCustomer.getEmail(),
                testCustomer.getPhone(),
                "Colombo",
                "Colombo",
                LocalDate.of(2026, 10, 10),
                LocalDate.of(2026, 10, 15),
                new BigDecimal("42500.00"),
                null,
                BookingStatus.CONFIRMED
        );
        bookingRepository.save(existing);

        // New: Oct 15 -> Oct 20 (adjacent / contiguous)
        boolean isAvail = vehicleService.isVehicleAvailable(
                testVehicle.getVehicleId(),
                LocalDate.of(2026, 10, 15),
                LocalDate.of(2026, 10, 20)
        );

        assertTrue(isAvail, "Vehicle should be available for adjacent rental period");
    }

    @Test
    @DisplayName("5. Modify Booking: Successfully update dates when available")
    void testModifyBookingSuccess() {
        Booking booking = new Booking(
                null,
                testCustomer,
                testVehicle,
                testCustomer.getFullName(),
                testCustomer.getEmail(),
                testCustomer.getPhone(),
                "Colombo",
                "Colombo",
                LocalDate.of(2026, 10, 10),
                LocalDate.of(2026, 10, 12),
                new BigDecimal("17000.00"),
                null,
                BookingStatus.CONFIRMED
        );
        booking = bookingRepository.save(booking);

        BookingUpdateDTO updateDTO = new BookingUpdateDTO();
        updateDTO.setStartDate(LocalDate.of(2026, 10, 20));
        updateDTO.setEndDate(LocalDate.of(2026, 10, 25));
        updateDTO.setPickupLocation("Kandy Branch");
        updateDTO.setDropoffLocation("Colombo Branch");

        BookingResponseDTO updated = bookingService.modifyBooking(booking.getBookingId(), updateDTO);

        assertEquals(BookingStatus.MODIFIED, updated.getBookingStatus());
        assertEquals(LocalDate.of(2026, 10, 20), updated.getStartDate());
        assertEquals(LocalDate.of(2026, 10, 25), updated.getEndDate());
        assertEquals(5, updated.getRentalDays());
    }

    @Test
    @DisplayName("6. Cancel Booking & Soft Delete: Releases vehicle availability")
    void testCancelBookingReleasesDates() {
        // Create booking Oct 10 -> Oct 15
        Booking booking = new Booking(
                null,
                testCustomer,
                testVehicle,
                testCustomer.getFullName(),
                testCustomer.getEmail(),
                testCustomer.getPhone(),
                "Colombo",
                "Colombo",
                LocalDate.of(2026, 10, 10),
                LocalDate.of(2026, 10, 15),
                new BigDecimal("42500.00"),
                null,
                BookingStatus.CONFIRMED
        );
        booking = bookingRepository.save(booking);

        // Before cancellation: not available
        assertFalse(vehicleService.isVehicleAvailable(
                testVehicle.getVehicleId(),
                LocalDate.of(2026, 10, 11),
                LocalDate.of(2026, 10, 14)
        ));

        // Perform cancellation (Soft Delete)
        BookingResponseDTO cancelled = bookingService.cancelBooking(booking.getBookingId());
        assertEquals(BookingStatus.CANCELLED, cancelled.getBookingStatus());

        // Booking record still remains in the database (history preserved)
        Booking inDb = bookingRepository.findById(booking.getBookingId()).orElse(null);
        assertNotNull(inDb);
        assertEquals(BookingStatus.CANCELLED, inDb.getBookingStatus());

        // After cancellation: vehicle is now available again for those same dates!
        assertTrue(vehicleService.isVehicleAvailable(
                testVehicle.getVehicleId(),
                LocalDate.of(2026, 10, 11),
                LocalDate.of(2026, 10, 14)
        ), "Vehicle must become available after cancellation");
    }
}
