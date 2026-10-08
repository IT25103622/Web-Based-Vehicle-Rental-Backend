package com.sliit.vehiclerental.accesscontrol.repository;

import com.sliit.vehiclerental.accesscontrol.entity.BackupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BackupStatusRepository extends JpaRepository<BackupStatus, Long> {
    List<BackupStatus> findAllByOrderByStartedAtDesc(Pageable pageable);
}
