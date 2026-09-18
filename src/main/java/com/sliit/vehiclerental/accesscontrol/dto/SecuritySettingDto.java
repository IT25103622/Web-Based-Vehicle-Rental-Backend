package com.sliit.vehiclerental.accesscontrol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecuritySettingDto {
    private String key;
    private String value;
    private String description;
}
