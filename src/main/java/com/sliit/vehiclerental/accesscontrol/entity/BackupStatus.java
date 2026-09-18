package com.sliit.vehiclerental.accesscontrol.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "backup_status")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BackupStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BackupResult result; // RUNNING, SUCCESS, FAILED

    private String filePath;

    private Long fileSizeBytes;

    @Lob
    private String errorMessage;

    public enum BackupResult { RUNNING, SUCCESS, FAILED }
}
