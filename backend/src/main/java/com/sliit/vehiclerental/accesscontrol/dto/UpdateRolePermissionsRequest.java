package com.sliit.vehiclerental.accesscontrol.dto;

import lombok.Data;

import java.util.Set;

@Data
public class UpdateRolePermissionsRequest {
    /** Full replacement set of permission codes granted to the role. */
    private Set<String> permissionCodes;
}
