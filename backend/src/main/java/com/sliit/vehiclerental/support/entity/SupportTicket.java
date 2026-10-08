package com.sliit.vehiclerental.support.entity;

import com.sliit.vehiclerental.booking.entity.Booking;
import com.sliit.vehiclerental.customer.entity.CustomerUser;
import com.sliit.vehiclerental.fleet.entity.Vehicle;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "support_tickets")
public class SupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Long ticketId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private CustomerUser customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(nullable = false, length = 100)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String section;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SupportTicketStatus status = SupportTicketStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Column(name = "date_issued", nullable = false, updatable = false)
    private LocalDateTime dateIssued;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public SupportTicket() {
    }

    @PrePersist
    protected void onCreate() {
        dateIssued = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = SupportTicketStatus.OPEN;
        if (priority == null) priority = TicketPriority.MEDIUM;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }
    public CustomerUser getCustomer() { return customer; }
    public void setCustomer(CustomerUser customer) { this.customer = customer; }
    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }
    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }
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
