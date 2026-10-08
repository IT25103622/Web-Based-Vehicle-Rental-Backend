package com.sliit.vehiclerental.accesscontrol.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendOtpEmail(String toEmail, String otp, int expiryMinutes) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Your Vehicle Rental Service verification code");
            message.setText(
                    "Your one-time verification code is: " + otp + "\n\n" +
                    "This code expires in " + expiryMinutes + " minutes.\n" +
                    "If you did not attempt to log in, please contact IT Security immediately."
            );
            mailSender.send(message);
        } catch (Exception e) {
            // Deliberately not rethrown to the login flow's response - failure here
            // must never leak whether an account exists. It's logged for IT Security instead.
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendTemporaryPasswordEmail(String toEmail, String tempPassword) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Your Vehicle Rental Service account");
            message.setText(
                    "An account has been created / your password was reset.\n" +
                    "Temporary password: " + tempPassword + "\n\n" +
                    "You will be required to change this password on first login."
            );
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send temp password email to {}: {}", toEmail, e.getMessage());
        }
    }
}
