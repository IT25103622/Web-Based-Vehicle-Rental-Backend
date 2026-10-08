package com.sliit.vehiclerental.accesscontrol.service;

import com.sliit.vehiclerental.accesscontrol.dto.*;
import com.sliit.vehiclerental.accesscontrol.entity.Role;
import com.sliit.vehiclerental.accesscontrol.entity.User;
import com.sliit.vehiclerental.accesscontrol.entity.UserStatus;
import com.sliit.vehiclerental.accesscontrol.exception.NotFoundException;
import com.sliit.vehiclerental.accesscontrol.repository.RoleRepository;
import com.sliit.vehiclerental.accesscontrol.repository.UserRepository;
import com.sliit.vehiclerental.accesscontrol.security.PermissionCodes;
import com.sliit.vehiclerental.accesscontrol.security.RequiresPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditLogService auditLogService;
    private static final SecureRandom RANDOM = new SecureRandom();

    @RequiresPermission(PermissionCodes.VIEW_USERS)
    public List<UserDto> listAll() {
        return userRepository.findAll().stream().map(this::toDto).toList();
    }

    @RequiresPermission(PermissionCodes.VIEW_USERS)
    public UserDto getById(Long id) {
        return toDto(findUserOrThrow(id));
    }

    /** No permission gate - every authenticated user may read their own profile. */
    public UserDto getOwnProfile(Long id) {
        return toDto(findUserOrThrow(id));
    }

    @RequiresPermission(PermissionCodes.CREATE_USER)
    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new NotFoundException("Role not found: " + request.getRole()));

        boolean generatedPassword = request.getInitialPassword() == null || request.getInitialPassword().isBlank();
        String rawPassword = generatedPassword ? generateTempPassword() : request.getInitialPassword();

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(role)
                .status(UserStatus.ACTIVE)
                .mfaEnabled(request.isMfaEnabled())
                .mustChangePassword(true)
                .build();

        user = userRepository.save(user);

        if (generatedPassword) {
            emailService.sendTemporaryPasswordEmail(user.getEmail(), rawPassword);
        }

        auditLogService.log("USER_CREATED", "USER", String.valueOf(user.getId()),
                "Created account with role " + role.getName(), null);

        return toDto(user);
    }

    @RequiresPermission(PermissionCodes.UPDATE_USER)
    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        User user = findUserOrThrow(id);
        StringBuilder changes = new StringBuilder();

        if (request.getFullName() != null) {
            changes.append("fullName -> ").append(request.getFullName()).append("; ");
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getRole() != null) {
            Role role = roleRepository.findByName(request.getRole())
                    .orElseThrow(() -> new NotFoundException("Role not found: " + request.getRole()));
            changes.append("role -> ").append(role.getName()).append("; ");
            user.setRole(role);
        }
        if (request.getMfaEnabled() != null) {
            changes.append("mfaEnabled -> ").append(request.getMfaEnabled()).append("; ");
            user.setMfaEnabled(request.getMfaEnabled());
        }
        if (request.getSessionTimeoutMinutes() != null) {
            changes.append("sessionTimeoutMinutes -> ").append(request.getSessionTimeoutMinutes()).append("; ");
            user.setSessionTimeoutMinutes(request.getSessionTimeoutMinutes());
        }

        user = userRepository.save(user);

        auditLogService.log("USER_UPDATED", "USER", String.valueOf(user.getId()), changes.toString(), null);

        return toDto(user);
    }

    /** Soft-delete only - status flips to DEACTIVATED, row is never removed. */
    @RequiresPermission(PermissionCodes.DEACTIVATE_USER)
    @Transactional
    public UserDto setActive(Long id, boolean active) {
        User user = findUserOrThrow(id);
        user.setStatus(active ? UserStatus.ACTIVE : UserStatus.DEACTIVATED);
        user = userRepository.save(user);

        auditLogService.log(active ? "USER_REACTIVATED" : "USER_DEACTIVATED",
                "USER", String.valueOf(user.getId()), null, null);

        return toDto(user);
    }

    @RequiresPermission(PermissionCodes.RESET_USER_PASSWORD)
    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request) {
        User user = findUserOrThrow(id);

        boolean generated = request.getNewPassword() == null || request.getNewPassword().isBlank();
        String newPassword = generated ? generateTempPassword() : request.getNewPassword();

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(true);
        userRepository.save(user);

        if (generated) {
            emailService.sendTemporaryPasswordEmail(user.getEmail(), newPassword);
        }

        auditLogService.log("PASSWORD_RESET_BY_ADMIN", "USER", String.valueOf(user.getId()),
                "Password reset, mustChangePassword flagged", null);
    }

    @Transactional
    public void changeOwnPassword(Long userId, String currentPassword, String newPassword) {
        User user = findUserOrThrow(userId);

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);

        auditLogService.log("PASSWORD_CHANGED_SELF", "USER", String.valueOf(user.getId()), null, null);
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found: " + id));
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().getName().name())
                .status(user.getStatus().name())
                .mfaEnabled(user.isMfaEnabled())
                .sessionTimeoutMinutes(user.getSessionTimeoutMinutes())
                .mustChangePassword(user.isMustChangePassword())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
