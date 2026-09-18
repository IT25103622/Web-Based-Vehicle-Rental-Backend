package com.sliit.vehiclerental.accesscontrol.dto;

import com.sliit.vehiclerental.accesscontrol.entity.RoleName;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String fullName;
    private String phone;
    private RoleName role;
    private Boolean mfaEnabled;
    private Integer sessionTimeoutMinutes;
}
