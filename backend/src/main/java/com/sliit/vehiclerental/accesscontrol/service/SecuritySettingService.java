package com.sliit.vehiclerental.accesscontrol.service;

import com.sliit.vehiclerental.accesscontrol.dto.SecuritySettingDto;
import com.sliit.vehiclerental.accesscontrol.entity.SecuritySetting;
import com.sliit.vehiclerental.accesscontrol.repository.SecuritySettingRepository;
import com.sliit.vehiclerental.accesscontrol.security.PermissionCodes;
import com.sliit.vehiclerental.accesscontrol.security.RequiresPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SecuritySettingService {

    private final SecuritySettingRepository repository;
    private final AuditLogService auditLogService;

    @RequiresPermission(PermissionCodes.CONFIGURE_SESSION_SETTINGS)
    public List<SecuritySettingDto> listAll() {
        return repository.findAll().stream()
                .map(s -> new SecuritySettingDto(s.getSettingKey(), s.getSettingValue(), s.getDescription()))
                .toList();
    }

    @RequiresPermission(PermissionCodes.CONFIGURE_SESSION_SETTINGS)
    @Transactional
    public SecuritySettingDto update(String key, String newValue) {
        SecuritySetting setting = repository.findById(key)
                .orElseThrow(() -> new IllegalArgumentException("Unknown setting: " + key));

        String oldValue = setting.getSettingValue();
        setting.setSettingValue(newValue);
        repository.save(setting);

        auditLogService.log("SECURITY_SETTING_UPDATED", "SECURITY_SETTING", key,
                key + ": '" + oldValue + "' -> '" + newValue + "'", null);

        return new SecuritySettingDto(setting.getSettingKey(), setting.getSettingValue(), setting.getDescription());
    }
}
