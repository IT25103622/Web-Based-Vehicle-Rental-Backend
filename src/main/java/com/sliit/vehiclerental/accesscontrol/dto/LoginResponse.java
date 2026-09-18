package com.sliit.vehiclerental.accesscontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private boolean mfaRequired;
    private String token;         // present only when mfaRequired = false, or after OTP verify
    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private Set<String> permissions;
    private long expiresInMs;
}
