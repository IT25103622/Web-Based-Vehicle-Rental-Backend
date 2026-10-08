package com.sliit.vehiclerental.accesscontrol.scheduler;

import com.sliit.vehiclerental.accesscontrol.service.BackupService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BackupScheduler {

    private final BackupService backupService;

    /** Defaults to 2 AM daily - configurable via app.backup.cron. */
    @Scheduled(cron = "${app.backup.cron:0 0 2 * * *}")
    public void scheduledBackup() {
        backupService.runBackup();
    }
}
