package com.sliit.vehiclerental.accesscontrol.dto;

import com.sliit.vehiclerental.accesscontrol.entity.RoleName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank
    private String fullName;

    @NotBlank @Email
    private String email;

    private String phone;

    @NotNull
    private RoleName role;

    /** If blank, a temporary password is generated and the account is
     *  flagged mustChangePassword = true. */
    private String initialPassword;

    private boolean mfaEnabled;
}
