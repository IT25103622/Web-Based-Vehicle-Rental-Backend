package com.sliit.vehiclerental.support.dto;

import com.sliit.vehiclerental.support.entity.SupportTicketStatus;
import com.sliit.vehiclerental.support.entity.TicketPriority;

import java.time.LocalDateTime;

public class SupportTicketResponseDTO {

    private Long ticketId;
    private Long customerId;
    private String customerName;
    private Long bookingId;
    private Long vehicleId;
    private String subject;
    private String description;
    private String section;
    private SupportTicketStatus status;
    private TicketPriority priority;
    private LocalDateTime dateIssued;
    private LocalDateTime updatedAt;

    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }
    public SupportTicketStatus getStatus() { return status; }
    public void setStatus(SupportTicketStatus status) { this.status = status; }
    public TicketPriority getPriority() { return priority; }
    public void setPriority(TicketPriority priority) { this.priority = priority; }
    public LocalDateTime getDateIssued() { return dateIssued; }
    public void setDateIssued(LocalDateTime dateIssued) { this.dateIssued = dateIssued; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
