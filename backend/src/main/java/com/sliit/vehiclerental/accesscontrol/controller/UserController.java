package com.sliit.vehiclerental.accesscontrol.controller;

import com.sliit.vehiclerental.accesscontrol.dto.*;
import com.sliit.vehiclerental.accesscontrol.security.UserPrincipal;
import com.sliit.vehiclerental.accesscontrol.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserDto> listUsers() {
        return userService.listAll();
    }

    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userService.getById(id);
    }

    /** Lets the SPA rehydrate the logged-in user's profile + permissions after
     *  a page refresh, without needing VIEW_USERS permission (own record only). */
    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getOwnProfile(principal.getId()));
    }

    @PostMapping
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    @PutMapping("/{id}")
    public UserDto updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @PatchMapping("/{id}/deactivate")
    public UserDto deactivate(@PathVariable Long id) {
        return userService.setActive(id, false);
    }

    @PatchMapping("/{id}/reactivate")
    public UserDto reactivate(@PathVariable Long id) {
        return userService.setActive(id, true);
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id, @RequestBody(required = false) ResetPasswordRequest request) {
        userService.resetPassword(id, request != null ? request : new ResetPasswordRequest());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<Void> changeOwnPassword(@AuthenticationPrincipal UserPrincipal principal,
                                                    @Valid @RequestBody ChangePasswordRequest request) {
        userService.changeOwnPassword(principal.getId(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.noContent().build();
    }
}
