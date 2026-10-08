package com.sliit.vehiclerental.accesscontrol.service;

import com.sliit.vehiclerental.accesscontrol.dto.PermissionDto;
import com.sliit.vehiclerental.accesscontrol.dto.RoleDto;
import com.sliit.vehiclerental.accesscontrol.dto.UpdateRolePermissionsRequest;
import com.sliit.vehiclerental.accesscontrol.entity.Permission;
import com.sliit.vehiclerental.accesscontrol.entity.Role;
import com.sliit.vehiclerental.accesscontrol.exception.NotFoundException;
import com.sliit.vehiclerental.accesscontrol.repository.PermissionRepository;
import com.sliit.vehiclerental.accesscontrol.repository.RoleRepository;
import com.sliit.vehiclerental.accesscontrol.security.PermissionCodes;
import com.sliit.vehiclerental.accesscontrol.security.RequiresPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final AuditLogService auditLogService;

    @RequiresPermission(PermissionCodes.VIEW_ROLES)
    public List<RoleDto> listRolesWithPermissions() {
        return roleRepository.findAll().stream().map(this::toDtoWithPermissions).toList();
    }

    @RequiresPermission(PermissionCodes.MANAGE_ROLE_PERMISSIONS)
    @Transactional
    public RoleDto updateRolePermissions(Long roleId, UpdateRolePermissionsRequest request) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new NotFoundException("Role not found: " + roleId));

        // SYSTEM_ADMIN must always retain MANAGE_ROLE_PERMISSIONS so the platform
        // can never lock itself out of its own access-control screen.
        Set<String> requestedCodes = request.getPermissionCodes() == null ? new HashSet<>() : new HashSet<>(request.getPermissionCodes());
        if (role.getName().name().equals("SYSTEM_ADMIN")) {
            requestedCodes.add(PermissionCodes.MANAGE_ROLE_PERMISSIONS);
            requestedCodes.add(PermissionCodes.VIEW_ROLES);
        }

        Set<Permission> newPermissions = new HashSet<>();
        for (String code : requestedCodes) {
            Permission permission = permissionRepository.findByCode(code)
                    .orElseThrow(() -> new NotFoundException("Unknown permission code: " + code));
            newPermissions.add(permission);
        }

        role.setPermissions(newPermissions);
        role = roleRepository.save(role);

        auditLogService.log("ROLE_PERMISSIONS_UPDATED", "ROLE", String.valueOf(role.getId()),
                "New permission set: " + requestedCodes, null);

        // Return the full, up-to-date permission matrix for this role - not just
        // id/name/description - so callers don't have to re-fetch to see the result.
        return toDtoWithPermissions(role);
    }

    private RoleDto toDtoWithPermissions(Role role) {
        List<Permission> allPermissions = permissionRepository.findAll();
        Set<Long> grantedIds = role.getPermissions().stream().map(Permission::getId).collect(java.util.stream.Collectors.toSet());

        List<PermissionDto> permissionDtos = allPermissions.stream()
                .map(p -> PermissionDto.builder()
                        .id(p.getId())
                        .code(p.getCode())
                        .description(p.getDescription())
                        .category(p.getCategory())
                        .granted(grantedIds.contains(p.getId()))
                        .build())
                .toList();

        return RoleDto.builder()
                .id(role.getId())
                .name(role.getName().name())
                .description(role.getDescription())
                .permissions(permissionDtos)
                .build();
    }
}