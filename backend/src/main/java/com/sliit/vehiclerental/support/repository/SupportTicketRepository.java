package com.sliit.vehiclerental.support.repository;

import com.sliit.vehiclerental.support.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    List<SupportTicket> findByCustomer_IdOrderByDateIssuedDesc(Long customerId);

    List<SupportTicket> findAllByOrderByDateIssuedDesc();
}
