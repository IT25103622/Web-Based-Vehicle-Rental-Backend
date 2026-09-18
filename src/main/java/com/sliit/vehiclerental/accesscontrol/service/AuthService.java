package com.sliit.vehiclerental.accesscontrol.service;

import com.sliit.vehiclerental.accesscontrol.dto.LoginResponse;
import com.sliit.vehiclerental.accesscontrol.entity.User;
import com.sliit.vehiclerental.accesscontrol.entity.UserStatus;
import com.sliit.vehiclerental.accesscontrol.repository.UserRepository;
import com.sliit.vehiclerental.accesscontrol.security.JwtUtil;
import com.sliit.vehiclerental.accesscontrol.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final MfaService mfaService;
    private final AuditLogService auditLogService;

    /** Step 1: verify credentials. If MFA is enabled on the account, an OTP
     *  is emailed and no token is issued yet - the client must call verifyOtp. */
    @Transactional
    public LoginResponse login(String email, String rawPassword, String ipAddress) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // No matching account - still record the attempt (actorUserId null,
            // email captured in details) so repeated guesses against unknown
            // addresses are visible to IT Security, not silently dropped.
            auditLogService.logAsActor(null, "UNKNOWN", "LOGIN_FAILED_UNKNOWN_EMAIL",
                    "USER", null, "Attempted email: " + email, ipAddress);
            throw new BadCredentialsException("Invalid email or password");
        }

        if (user.getStatus() == UserStatus.DEACTIVATED) {
            auditLogService.logAsActor(user.getId(), user.getEmail(), "LOGIN_BLOCKED_DEACTIVATED",
                    "USER", String.valueOf(user.getId()), "Login attempt on deactivated account", ipAddress);
            throw new BadCredentialsException("This account has been deactivated. Contact an administrator.");
        }

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            auditLogService.logAsActor(user.getId(), user.getEmail(), "LOGIN_FAILED",
                    "USER", String.valueOf(user.getId()), "Incorrect password", ipAddress);
            throw new BadCredentialsException("Invalid email or password");
        }

        if (user.isMfaEnabled()) {
            mfaService.issueLoginOtp(user);
            auditLogService.logAsActor(user.getId(), user.getEmail(), "LOGIN_MFA_CHALLENGE_SENT",
                    "USER", String.valueOf(user.getId()), "Password verified, OTP emailed", ipAddress);
            return LoginResponse.builder()
                    .mfaRequired(true)
                    .email(user.getEmail())
                    .build();
        }

        return issueSessionAndLog(user, ipAddress);
    }

    /** Step 2 (only when MFA is enabled): verify the emailed OTP and issue the JWT. */
    @Transactional
    public LoginResponse verifyOtp(String email, String submittedOtp, String ipAddress) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid request"));

        boolean valid = mfaService.verifyLoginOtp(user, submittedOtp);
        if (!valid) {
            auditLogService.logAsActor(user.getId(), user.getEmail(), "LOGIN_MFA_FAILED",
                    "USER", String.valueOf(user.getId()), "Invalid or expired OTP", ipAddress);
            throw new BadCredentialsException("Invalid or expired verification code");
        }

        return issueSessionAndLog(user, ipAddress);
    }

    private LoginResponse issueSessionAndLog(User user, String ipAddress) {
        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtUtil.generateToken(principal);

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        auditLogService.logAsActor(user.getId(), user.getEmail(), "LOGIN_SUCCESS",
                "USER", String.valueOf(user.getId()), "Session issued", ipAddress);

        return LoginResponse.builder()
                .mfaRequired(false)
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().getName().name())
                .permissions(principal.getPermissionCodes())
                .expiresInMs(jwtUtil.getExpirationMs())
                .build();
    }
}