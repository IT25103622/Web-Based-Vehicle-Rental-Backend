package com.sliit.vehiclerental.accesscontrol.controller;

import com.sliit.vehiclerental.accesscontrol.dto.LoginRequest;
import com.sliit.vehiclerental.accesscontrol.dto.LoginResponse;
import com.sliit.vehiclerental.accesscontrol.dto.OtpVerifyRequest;
import com.sliit.vehiclerental.accesscontrol.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpReq) {
        LoginResponse response = authService.login(request.getEmail(), request.getPassword(), clientIp(httpReq));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<LoginResponse> verifyOtp(@Valid @RequestBody OtpVerifyRequest request, HttpServletRequest httpReq) {
        LoginResponse response = authService.verifyOtp(request.getEmail(), request.getOtp(), clientIp(httpReq));
        return ResponseEntity.ok(response);
    }

    private String clientIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        return forwarded != null ? forwarded.split(",")[0].trim() : req.getRemoteAddr();
    }
}
