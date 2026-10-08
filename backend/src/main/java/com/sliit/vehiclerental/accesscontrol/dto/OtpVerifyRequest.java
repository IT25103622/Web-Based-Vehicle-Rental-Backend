package com.sliit.vehiclerental.accesscontrol.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OtpVerifyRequest {
    @NotBlank
    private String email;

    @NotBlank
    private String otp;
}
