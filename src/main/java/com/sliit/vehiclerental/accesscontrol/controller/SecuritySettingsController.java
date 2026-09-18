package com.sliit.vehiclerental.accesscontrol.controller;

import com.sliit.vehiclerental.accesscontrol.dto.SecuritySettingDto;
import com.sliit.vehiclerental.accesscontrol.service.SecuritySettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/security-settings")
@RequiredArgsConstructor
public class SecuritySettingsController {

    private final SecuritySettingService securitySettingService;

    @GetMapping
    public List<SecuritySettingDto> list() {
        return securitySettingService.listAll();
    }

    @PutMapping("/{key}")
    public SecuritySettingDto update(@PathVariable String key, @RequestBody Map<String, String> body) {
        return securitySettingService.update(key, body.get("value"));
    }
}
