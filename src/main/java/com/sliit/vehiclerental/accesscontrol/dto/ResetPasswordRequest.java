package com.sliit.vehiclerental.accesscontrol.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    /** Optional - if omitted the server generates a temporary password
     *  and forces a change on next login. */
    private String newPassword;
}
