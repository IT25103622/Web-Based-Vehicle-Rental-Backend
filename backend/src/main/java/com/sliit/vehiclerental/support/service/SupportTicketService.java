package com.sliit.vehiclerental.support.service;

import com.sliit.vehiclerental.accesscontrol.exception.NotFoundException;
import com.sliit.vehiclerental.accesscontrol.service.AuditLogService;
import com.sliit.vehiclerental.booking.entity.Booking;
import com.sliit.vehiclerental.booking.repository.BookingRepository;
import com.sliit.vehiclerental.customer.entity.CustomerUser;
import com.sliit.vehiclerental.customer.repository.CustomerUserRepository;
import com.sliit.vehiclerental.fleet.entity.Vehicle;
import com.sliit.vehiclerental.fleet.repository.VehicleRepository;
import com.sliit.vehiclerental.support.dto.SupportTicketRequestDTO;
import com.sliit.vehiclerental.support.dto.SupportTicketResponseDTO;
import com.sliit.vehiclerental.support.entity.SupportTicket;
import com.sliit.vehiclerental.support.entity.SupportTicketStatus;
import com.sliit.vehiclerental.support.entity.TicketPriority;
import com.sliit.vehiclerental.support.repository.SupportTicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final CustomerUserRepository customerUserRepository;
    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final AuditLogService auditLogService;

    public SupportTicketService(
            SupportTicketRepository supportTicketRepository,
            CustomerUserRepository customerUserRepository,
            BookingRepository bookingRepository,
            VehicleRepository vehicleRepository,
            AuditLogService auditLogService) {
        this.supportTicketRepository = supportTicketRepository;
        this.customerUserRepository = customerUserRepository;
        this.bookingRepository = bookingRepository;
        this.vehicleRepository = vehicleRepository;
        this.auditLogService = auditLogService;
    }

    public SupportTicketResponseDTO createTicket(SupportTicketRequestDTO request, Long customerId) {
        if (request.getSubject() == null || request.getSubject().isBlank()) {
            throw new IllegalArgumentException("Subject is required.");
        }
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description is required.");
        }

        CustomerUser customer = customerUserRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found with ID: " + customerId));

        SupportTicket ticket = new SupportTicket();
        ticket.setCustomer(customer);
        ticket.setSubject(request.getSubject().trim());
        ticket.setDescription(request.getDescription().trim());
        ticket.setSection(request.getSection());
        ticket.setPriority(request.getPriority() != null ? request.getPriority() : TicketPriority.MEDIUM);

        if (request.getBookingId() != null) {
            Booking booking = bookingRepository.findById(request.getBookingId())
                    .orElseThrow(() -> new NotFoundException("Booking not found with ID: " + request.getBookingId()));
            ticket.setBooking(booking);
        }

        if (request.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new NotFoundException("Vehicle not found with ID: " + request.getVehicleId()));
            ticket.setVehicle(vehicle);
        }

        SupportTicket saved = supportTicketRepository.save(ticket);

        auditLogService.log("SUPPORT_TICKET_CREATED", "SUPPORT_TICKET", String.valueOf(saved.getTicketId()),
                "Ticket opened: " + saved.getSubject(), null);

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<SupportTicketResponseDTO> getTicketsByCustomer(Long customerId) {
        return supportTicketRepository.findByCustomer_IdOrderByDateIssuedDesc(customerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SupportTicketResponseDTO> getAllTickets() {
        return supportTicketRepository.findAllByOrderByDateIssuedDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SupportTicketResponseDTO getTicketById(Long ticketId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Support ticket not found with ID: " + ticketId));
        return toDto(ticket);
    }

    public SupportTicketResponseDTO updateStatus(Long ticketId, SupportTicketStatus status) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Support ticket not found with ID: " + ticketId));

        SupportTicketStatus oldStatus = ticket.getStatus();
        ticket.setStatus(status);
        SupportTicket updated = supportTicketRepository.save(ticket);

        auditLogService.log("SUPPORT_TICKET_STATUS_UPDATED", "SUPPORT_TICKET", String.valueOf(ticketId),
                "Status changed: " + oldStatus + " -> " + status, null);

        return toDto(updated);
    }

    private SupportTicketResponseDTO toDto(SupportTicket ticket) {
        SupportTicketResponseDTO response = new SupportTicketResponseDTO();
        response.setTicketId(ticket.getTicketId());

        if (ticket.getCustomer() != null) {
            response.setCustomerId(ticket.getCustomer().getId());
            response.setCustomerName(ticket.getCustomer().getFullName());
        }
        if (ticket.getBooking() != null) {
            response.setBookingId(ticket.getBooking().getBookingId());
        }
        if (ticket.getVehicle() != null) {
            response.setVehicleId(ticket.getVehicle().getId());
        }

        response.setSubject(ticket.getSubject());
        response.setDescription(ticket.getDescription());
        response.setSection(ticket.getSection());
        response.setStatus(ticket.getStatus());
        response.setPriority(ticket.getPriority());
        response.setDateIssued(ticket.getDateIssued());
        response.setUpdatedAt(ticket.getUpdatedAt());

        return response;
    }
}
