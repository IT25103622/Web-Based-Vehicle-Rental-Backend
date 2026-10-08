package com.sliit.vehiclerental.support.dto;

import com.sliit.vehiclerental.support.entity.TicketPriority;

public class SupportTicketRequestDTO {

    private Long bookingId;
    private Long vehicleId;
    private String subject;
    private String description;
    private String section;
    private TicketPriority priority;

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
    public TicketPriority getPriority() { return priority; }
    public void setPriority(TicketPriority priority) { this.priority = priority; }
}
