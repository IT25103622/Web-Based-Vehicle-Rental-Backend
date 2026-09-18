package com.sliit.vehiclerental.accesscontrol.repository;

import com.sliit.vehiclerental.accesscontrol.entity.SecuritySetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SecuritySettingRepository extends JpaRepository<SecuritySetting, String> {
}
