package com.sliit.vehiclerental.accesscontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDto {
    private Long id;
    private Long actorUserId;
    private String actorEmail;
    private String action;
    private String entityType;
    private String entityId;
    private String details;
    private String ipAddress;
    private LocalDateTime timestamp;
}
