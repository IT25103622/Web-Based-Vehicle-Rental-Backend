package com.sliit.vehiclerental.accesscontrol.controller;

import com.sliit.vehiclerental.accesscontrol.dto.AuditLogDto;
import com.sliit.vehiclerental.accesscontrol.security.PermissionCodes;
import com.sliit.vehiclerental.accesscontrol.security.RequiresPermission;
import com.sliit.vehiclerental.accesscontrol.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @RequiresPermission(PermissionCodes.VIEW_AUDIT_LOG)
    public Page<AuditLogDto> search(
            @RequestParam(required = false) String actorEmail,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return auditLogService.search(actorEmail, action, page, size);
    }
}
