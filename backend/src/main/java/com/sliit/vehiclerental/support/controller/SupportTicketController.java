package com.sliit.vehiclerental.support.controller;

import com.sliit.vehiclerental.accesscontrol.security.PermissionCodes;
import com.sliit.vehiclerental.accesscontrol.security.RequiresPermission;
import com.sliit.vehiclerental.accesscontrol.security.UserPrincipal;
import com.sliit.vehiclerental.support.dto.SupportTicketRequestDTO;
import com.sliit.vehiclerental.support.dto.SupportTicketResponseDTO;
import com.sliit.vehiclerental.support.entity.SupportTicketStatus;
import com.sliit.vehiclerental.support.service.SupportTicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support-tickets")
public class SupportTicketController {

    private final SupportTicketService supportTicketService;

    public SupportTicketController(SupportTicketService supportTicketService) {
        this.supportTicketService = supportTicketService;
    }

    /** Customers raise a ticket about a booking/vehicle/anything else. */
    @PostMapping
    public ResponseEntity<SupportTicketResponseDTO> createTicket(
            @RequestBody SupportTicketRequestDTO request,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (principal == null || principal.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        SupportTicketResponseDTO createdTicket = supportTicketService.createTicket(request, principal.getId());
        return new ResponseEntity<>(createdTicket, HttpStatus.CREATED);
    }

    /** Customers see only their own tickets; support staff see everything. */
    @GetMapping
    public ResponseEntity<List<SupportTicketResponseDTO>> getTickets(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String role = principal.getRole();
        if (role == null || "CUSTOMER".equalsIgnoreCase(role)) {
            return ResponseEntity.ok(supportTicketService.getTicketsByCustomer(principal.getId()));
        }

        return ResponseEntity.ok(supportTicketService.getAllTickets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupportTicketResponseDTO> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(supportTicketService.getTicketById(id));
    }

    @PutMapping("/{id}/status")
    @RequiresPermission(PermissionCodes.MANAGE_SUPPORT_TICKETS)
    public ResponseEntity<SupportTicketResponseDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam SupportTicketStatus status) {
        return ResponseEntity.ok(supportTicketService.updateStatus(id, status));
    }
}
