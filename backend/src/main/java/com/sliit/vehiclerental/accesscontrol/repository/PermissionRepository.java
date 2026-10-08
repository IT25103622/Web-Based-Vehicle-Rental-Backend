package com.sliit.vehiclerental.accesscontrol.repository;

import com.sliit.vehiclerental.accesscontrol.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Optional<Permission> findByCode(String code);
}
