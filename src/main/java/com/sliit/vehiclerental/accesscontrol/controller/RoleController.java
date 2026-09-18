package com.sliit.vehiclerental.accesscontrol.controller;

import com.sliit.vehiclerental.accesscontrol.dto.RoleDto;
import com.sliit.vehiclerental.accesscontrol.dto.UpdateRolePermissionsRequest;
import com.sliit.vehiclerental.accesscontrol.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    public List<RoleDto> listRoles() {
        return roleService.listRolesWithPermissions();
    }

    @PutMapping("/{id}/permissions")
    public RoleDto updatePermissions(@PathVariable Long id, @RequestBody UpdateRolePermissionsRequest request) {
        return roleService.updateRolePermissions(id, request);
    }
}
