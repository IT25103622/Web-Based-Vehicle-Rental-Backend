package com.sliit.vehiclerental.accesscontrol.controller;

import com.sliit.vehiclerental.accesscontrol.dto.BackupStatusDto;
import com.sliit.vehiclerental.accesscontrol.service.BackupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/backups")
@RequiredArgsConstructor
public class BackupController {

    private final BackupService backupService;

    @GetMapping
    public List<BackupStatusDto> history(@RequestParam(defaultValue = "20") int limit) {
        return backupService.recentHistory(limit);
    }

    @PostMapping("/run")
    public BackupStatusDto runNow() {
        return backupService.triggerManualBackup();
    }
}
