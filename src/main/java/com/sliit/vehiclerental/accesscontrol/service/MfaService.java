package com.sliit.vehiclerental.accesscontrol.service;

import com.sliit.vehiclerental.accesscontrol.entity.OtpCode;
import com.sliit.vehiclerental.accesscontrol.entity.User;
import com.sliit.vehiclerental.accesscontrol.repository.OtpCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MfaService {

    private static final String LOGIN_PURPOSE = "LOGIN_MFA";
    private final SecureRandom random = new SecureRandom();

    private final OtpCodeRepository otpCodeRepository;
    private final EmailService emailService;

    @Value("${app.mfa.otp-length:6}")
    private int otpLength;

    @Value("${app.mfa.otp-expiry-minutes:5}")
    private int otpExpiryMinutes;

    public void issueLoginOtp(User user) {
        String code = generateNumericCode(otpLength);

        OtpCode otp = OtpCode.builder()
                .user(user)
                .code(code)
                .purpose(LOGIN_PURPOSE)
                .expiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .used(false)
                .build();

        otpCodeRepository.save(otp);
        emailService.sendOtpEmail(user.getEmail(), code, otpExpiryMinutes);
    }

    /** Returns true and marks the code used only if it is correct, unexpired, and unused. */
    public boolean verifyLoginOtp(User user, String submittedCode) {
        return otpCodeRepository
                .findTopByUserAndPurposeAndUsedFalseOrderByCreatedAtDesc(user, LOGIN_PURPOSE)
                .filter(otp -> otp.getCode().equals(submittedCode))
                .filter(otp -> otp.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(otp -> {
                    otp.setUsed(true);
                    otpCodeRepository.save(otp);
                    return true;
                })
                .orElse(false);
    }

    private String generateNumericCode(int length) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }
}
