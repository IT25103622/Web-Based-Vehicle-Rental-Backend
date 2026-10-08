package com.sliit.vehiclerental.accesscontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionDto {
    private Long id;
    private String code;
    private String description;
    private String category;
    private boolean granted; // used in role-permission-matrix responses
}
