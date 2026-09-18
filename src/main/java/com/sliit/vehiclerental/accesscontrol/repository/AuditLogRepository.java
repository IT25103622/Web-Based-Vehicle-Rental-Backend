package com.sliit.vehiclerental.accesscontrol.repository;

import com.sliit.vehiclerental.accesscontrol.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Intentionally exposes no update/delete helpers - only save (insert) and
 * read. The entity itself has no setters either. See schema.sql for the
 * DB-level triggers that make this immutability non-negotiable.
 */
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    Page<AuditLog> findByActorEmailContainingIgnoreCaseOrderByTimestampDesc(String actorEmail, Pageable pageable);
    Page<AuditLog> findByActionContainingIgnoreCaseOrderByTimestampDesc(String action, Pageable pageable);
}
