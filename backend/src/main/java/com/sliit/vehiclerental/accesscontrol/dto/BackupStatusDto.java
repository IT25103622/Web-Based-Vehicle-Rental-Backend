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
public class BackupStatusDto {
    private Long id;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String result;
    private String filePath;
    private Long fileSizeBytes;
    private String errorMessage;
}
