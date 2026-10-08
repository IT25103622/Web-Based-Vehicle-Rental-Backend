package com.sliit.vehiclerental.support.service;

import com.sliit.vehiclerental.booking.entity.Booking;
import com.sliit.vehiclerental.booking.repository.BookingRepository;
import com.sliit.vehiclerental.customer.entity.CustomerUser;
import com.sliit.vehiclerental.customer.repository.CustomerUserRepository;
import com.sliit.vehiclerental.support.dto.SupportTicketRequestDTO;
import com.sliit.vehiclerental.support.dto.SupportTicketResponseDTO;
import com.sliit.vehiclerental.support.entity.SupportTicket;
import com.sliit.vehiclerental.support.entity.SupportTicketStatus;
import com.sliit.vehiclerental.support.entity.TicketPriority;
import com.sliit.vehiclerental.support.repository.SupportTicketRepository;
import com.sliit.vehiclerental.vehicle.entity.Vehicle;
import com.sliit.vehiclerental.vehicle.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final CustomerUserRepository customerUserRepository;
    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;

    public SupportTicketService(
            SupportTicketRepository supportTicketRepository,
            CustomerUserRepository customerUserRepository,
            BookingRepository bookingRepository,
            VehicleRepository vehicleRepository) {

        this.supportTicketRepository = supportTicketRepository;
        this.customerUserRepository = customerUserRepository;
        this.bookingRepository = bookingRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public SupportTicketResponseDTO createTicket(
            SupportTicketRequestDTO request,
            Long customerId) {

        CustomerUser customer = customerUserRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        SupportTicket ticket = new SupportTicket();

        ticket.setCustomer(customer);
        ticket.setSubject(request.getSubject());
        ticket.setDescription(request.getDescription());
        ticket.setSection(request.getSection());

        if (request.getPriority() != null) {
            ticket.setPriority(request.getPriority());
        } else {
            ticket.setPriority(TicketPriority.MEDIUM);
        }

        if (request.getBookingId() != null) {
            Booking booking = bookingRepository.findById(request.getBookingId())
                    .orElseThrow(() -> new RuntimeException("Booking not found"));

            ticket.setBooking(booking);
        }

        if (request.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));

            ticket.setVehicle(vehicle);
        }

        SupportTicket savedTicket = supportTicketRepository.save(ticket);

        return convertToDTO(savedTicket);
    }

    public List<SupportTicketResponseDTO> getTicketsByCustomer(Long customerId) {

        return supportTicketRepository
                .findByCustomer_IdOrderByDateIssuedDesc(customerId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<SupportTicketResponseDTO> getAllTickets() {

        return supportTicketRepository
                .findAllByOrderByDateIssuedDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public SupportTicketResponseDTO getTicketById(Long ticketId) {

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support ticket not found"));

        return convertToDTO(ticket);
    }

    public SupportTicketResponseDTO updateStatus(
            Long ticketId,
            SupportTicketStatus status) {

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support ticket not found"));

        ticket.setStatus(status);

        SupportTicket updatedTicket = supportTicketRepository.save(ticket);

        return convertToDTO(updatedTicket);
    }

    private SupportTicketResponseDTO convertToDTO(SupportTicket ticket) {

        SupportTicketResponseDTO response = new SupportTicketResponseDTO();

        response.setTicketId(ticket.getTicketId());

        if (ticket.getCustomer() != null) {
            response.setCustomerId(ticket.getCustomer().getId());
        }

        if (ticket.getBooking() != null) {
            response.setBookingId(ticket.getBooking().getBookingId());
        }

        if (ticket.getVehicle() != null) {
            response.setVehicleId(ticket.getVehicle().getVehicleId());
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