package com.sliit.vehiclerental.accesscontrol.service;

import com.sliit.vehiclerental.accesscontrol.dto.BackupStatusDto;
import com.sliit.vehiclerental.accesscontrol.entity.BackupStatus;
import com.sliit.vehiclerental.accesscontrol.repository.BackupStatusRepository;
import com.sliit.vehiclerental.accesscontrol.security.PermissionCodes;
import com.sliit.vehiclerental.accesscontrol.security.RequiresPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Runs `mysqldump` against the platform database and tracks each run's
 * outcome in backup_status, so the Admin dashboard can show whether backups
 * are actually happening on schedule.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BackupService {

    private final BackupStatusRepository backupStatusRepository;
    private final AuditLogService auditLogService;

    @Value("${app.backup.mysqldump-path:mysqldump}")
    private String mysqldumpPath;

    @Value("${app.backup.output-dir:./backups}")
    private String outputDir;

    @Value("${app.backup.db-name}")
    private String dbName;

    @Value("${app.backup.db-user}")
    private String dbUser;

    @Value("${app.backup.db-password}")
    private String dbPassword;

    @Transactional
    public BackupStatusDto runBackup() {
        BackupStatus status = BackupStatus.builder()
                .startedAt(LocalDateTime.now())
                .result(BackupStatus.BackupResult.RUNNING)
                .build();
        status = backupStatusRepository.save(status);

        try {
            Path dir = Path.of(outputDir);
            Files.createDirectories(dir);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = dbName + "_" + timestamp + ".sql";
            Path outputFile = dir.resolve(fileName);

            List<String> command = List.of(
                    mysqldumpPath,
                    "-u", dbUser,
                    dbPassword == null || dbPassword.isBlank() ? "" : "-p" + dbPassword,
                    dbName
            );
            ProcessBuilder pb = new ProcessBuilder(command.stream().filter(s -> !s.isBlank()).toList());
            pb.redirectOutput(outputFile.toFile());
            pb.redirectErrorStream(false);

            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                status.setResult(BackupStatus.BackupResult.SUCCESS);
                status.setFilePath(outputFile.toString());
                status.setFileSizeBytes(Files.size(outputFile));
                auditLogService.logSystemEvent("BACKUP_SUCCESS", "BACKUP", String.valueOf(status.getId()),
                        "Backup written to " + outputFile);
            } else {
                status.setResult(BackupStatus.BackupResult.FAILED);
                status.setErrorMessage("mysqldump exited with code " + exitCode);
                auditLogService.logSystemEvent("BACKUP_FAILED", "BACKUP", String.valueOf(status.getId()),
                        "Exit code " + exitCode);
            }
        } catch (Exception e) {
            log.error("Backup failed", e);
            status.setResult(BackupStatus.BackupResult.FAILED);
            status.setErrorMessage(e.getMessage());
            auditLogService.logSystemEvent("BACKUP_FAILED", "BACKUP", String.valueOf(status.getId()), e.getMessage());
        }

        status.setCompletedAt(LocalDateTime.now());
        status = backupStatusRepository.save(status);
        return toDto(status);
    }

    @RequiresPermission(PermissionCodes.VIEW_BACKUP_STATUS)
    public List<BackupStatusDto> recentHistory(int limit) {
        return backupStatusRepository.findAllByOrderByStartedAtDesc(PageRequest.of(0, limit))
                .stream().map(this::toDto).toList();
    }

    @RequiresPermission(PermissionCodes.TRIGGER_MANUAL_BACKUP)
    public BackupStatusDto triggerManualBackup() {
        return runBackup();
    }

    private BackupStatusDto toDto(BackupStatus status) {
        return BackupStatusDto.builder()
                .id(status.getId())
                .startedAt(status.getStartedAt())
                .completedAt(status.getCompletedAt())
                .result(status.getResult().name())
                .filePath(status.getFilePath())
                .fileSizeBytes(status.getFileSizeBytes())
                .errorMessage(status.getErrorMessage())
                .build();
    }
}
