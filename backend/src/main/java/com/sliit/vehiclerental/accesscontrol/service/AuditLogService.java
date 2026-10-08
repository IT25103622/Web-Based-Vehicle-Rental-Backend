package com.sliit.vehiclerental.accesscontrol.service;

import com.sliit.vehiclerental.accesscontrol.dto.AuditLogDto;
import com.sliit.vehiclerental.accesscontrol.entity.AuditLog;
import com.sliit.vehiclerental.accesscontrol.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.sliit.vehiclerental.accesscontrol.security.UserPrincipal;

/**
 * Every other module in the merged system (Registration, Booking, Fleet,
 * Payments, Notifications) should call log(...) after any critical action.
 * This is intentionally the ONLY place that writes to audit_logs - there is
 * no update/delete method, on this service or the repository, on purpose.
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(String action, String entityType, String entityId, String details, String ipAddress) {
        Long actorId = null;
        String actorEmail = "SYSTEM";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            actorId = principal.getId();
            actorEmail = principal.getEmail();
        }

        writeEntry(actorId, actorEmail, action, entityType, entityId, details, ipAddress);
    }

    /**
     * Use when the acting user is known but not yet authenticated in the
     * SecurityContext - e.g. login attempts, where the whole point of the
     * log entry is to record who tried to log in, before/regardless of
     * whether that attempt succeeded. Without this overload, every login
     * event collapses to actorEmail="SYSTEM" and becomes unsearchable by
     * the account it actually concerns.
     */
    public void logAsActor(Long actorUserId, String actorEmail, String action, String entityType,
                           String entityId, String details, String ipAddress) {
        writeEntry(actorUserId, actorEmail, action, entityType, entityId, details, ipAddress);
    }

    private void writeEntry(Long actorId, String actorEmail, String action, String entityType,
                            String entityId, String details, String ipAddress) {
        AuditLog entry = AuditLog.builder()
                .actorUserId(actorId)
                .actorEmail(actorEmail)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .ipAddress(ipAddress)
                .build();

        auditLogRepository.save(entry);
    }

    /** Overload for events with no HTTP request context (e.g. scheduled jobs). */
    public void logSystemEvent(String action, String entityType, String entityId, String details) {
        AuditLog entry = AuditLog.builder()
                .actorUserId(null)
                .actorEmail("SYSTEM")
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .ipAddress(null)
                .build();
        auditLogRepository.save(entry);
    }

    public Page<AuditLogDto> search(String actorEmail, String action, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);

        Page<AuditLog> results;
        if (actorEmail != null && !actorEmail.isBlank()) {
            results = auditLogRepository.findByActorEmailContainingIgnoreCaseOrderByTimestampDesc(actorEmail, pageRequest);
        } else if (action != null && !action.isBlank()) {
            results = auditLogRepository.findByActionContainingIgnoreCaseOrderByTimestampDesc(action, pageRequest);
        } else {
            results = auditLogRepository.findAllByOrderByTimestampDesc(pageRequest);
        }

        return results.map(this::toDto);
    }

    private AuditLogDto toDto(AuditLog log) {
        return AuditLogDto.builder()
                .id(log.getId())
                .actorUserId(log.getActorUserId())
                .actorEmail(log.getActorEmail())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .timestamp(log.getTimestamp())
                .build();
    }
}